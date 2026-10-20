-- SDG Site: initial schema.
-- Clients follow their projects stage by stage; admins (the partners) run everything.
-- Every table has row level security on. Policies use the helpers below, which are security
-- definer so they can read profiles without recursing into profiles' own policies.

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'client');
create type public.project_type as enum ('site', 'app', 'sistema');
create type public.project_status as enum ('ativo', 'pausado', 'concluido');
create type public.stage_status as enum ('pendente', 'em_andamento', 'concluida');
create type public.update_kind as enum ('nota', 'print', 'video', 'deploy', 'marco');
create type public.update_source as enum ('manual', 'api', 'github');
create type public.portfolio_category as enum ('site', 'app', 'sistema', 'integracao');
create type public.lead_status as enum ('novo', 'em_contato', 'fechado', 'perdido');

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- The contracting company; it can have several users.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  cnpj_cpf text,
  contact_email text,
  phone text,
  created_at timestamptz not null default now()
);

-- One per auth user, created by trigger. A client user without client_id simply sees nothing.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'client',
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);
create index profiles_client_id_idx on public.profiles (client_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  type public.project_type not null,
  status public.project_status not null default 'ativo',
  -- the stage the client sees pulsing; kept in sync by advance_project_stage()
  current_stage_position smallint not null default 1 check (current_stage_position between 1 and 7),
  started_at timestamptz,
  due_at timestamptz,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_client_id_idx on public.projects (client_id);

-- At most 7 stages per project (design system rule); the default template has 5.
create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  position smallint not null check (position between 1 and 7),
  title text not null,
  description text,
  status public.stage_status not null default 'pendente',
  started_at timestamptz,
  completed_at timestamptz,
  unique (project_id, position)
);

-- The feed the client sees.
create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.project_stages (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  kind public.update_kind not null default 'nota',
  title text not null check (char_length(title) between 1 and 200),
  body text,
  source public.update_source not null default 'manual',
  created_at timestamptz not null default now()
);
create index project_updates_project_id_idx on public.project_updates (project_id, created_at desc);
create index project_updates_stage_id_idx on public.project_updates (stage_id);
create index project_updates_author_id_idx on public.project_updates (author_id);

-- Prints and videos in the private project-media bucket, under <project_id>/<update_id>/<file>.
create table public.update_media (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.project_updates (id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  width integer check (width > 0),
  height integer check (height > 0),
  duration_s numeric check (duration_s >= 0),
  created_at timestamptz not null default now()
);
create index update_media_update_id_idx on public.update_media (update_id);

-- Integration API tokens. Only the SHA-256 hash is stored; never readable from the browser.
create table public.project_tokens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  token_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_tokens_project_id_idx on public.project_tokens (project_id);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  -- paragraphs separated by a blank line
  body text not null default '',
  category public.portfolio_category not null,
  stack text[] not null default '{}',
  -- a path in the public "portfolio" bucket, or a site path starting with "/"
  cover_path text,
  cover_alt text not null default '',
  -- [{ "path": "...", "alt": "..." }]
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  live_url text,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  -- the approved prototype's generative pixel cover drawn on the landing carousel
  generative_cover text check (generative_cover in ('blocks', 'wave', 'dither', 'rings')),
  -- pixel-art images keep hard edges (no resizing)
  pixel_art boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index portfolio_items_listing_idx on public.portfolio_items (published, sort_order);

-- Contact form on the landing.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text check (char_length(phone) <= 40),
  company text check (char_length(company) <= 120),
  message text check (char_length(message) <= 4000),
  -- what they want to build: site, app, sistema, integracao, nao-sei
  service_interest text[] not null default '{}',
  status public.lead_status not null default 'novo',
  created_at timestamptz not null default now()
);
create index leads_status_idx on public.leads (status, created_at desc);

-- ---------------------------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger portfolio_items_set_updated_at before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------------------------

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.current_client_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select client_id from public.profiles where id = (select auth.uid()) and role = 'client';
$$;

-- Admins read every project; a client reads the projects of their own company.
create function public.can_read_project(p_project_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.projects
    where id = p_project_id and client_id = public.current_client_id()
  );
$$;

-- project-media objects live under <project_id>/...; anything else is unreadable.
create function public.can_read_project_path(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_read_project(split_part(p_name, '/', 1)::uuid)
    else false
  end;
$$;

revoke execute on function public.is_admin(), public.current_client_id(),
  public.can_read_project(uuid), public.can_read_project_path(text) from public;
grant execute on function public.is_admin(), public.current_client_id(),
  public.can_read_project(uuid), public.can_read_project_path(text) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Profiles follow the auth user's app_metadata
-- ---------------------------------------------------------------------------------------------
-- role and client_id come from raw_app_meta_data, which only the service role can write.
-- (raw_user_meta_data is editable by the user through auth.updateUser, so it must never grant
-- access.) Inviting a client = create/invite the user, then set app_metadata { role, client_id }.

create function public.handle_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.user_role := case
    when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.user_role
    else 'client'::public.user_role
  end;
  v_client_id uuid := case
    when new.raw_app_meta_data ->> 'client_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (new.raw_app_meta_data ->> 'client_id')::uuid
  end;
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, full_name, role, client_id)
    values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''), v_role, v_client_id);
  else
    update public.profiles set role = v_role, client_id = v_client_id where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_auth_user() from public;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_auth_user();
create trigger on_auth_user_app_metadata_changed after update of raw_app_meta_data on auth.users
  for each row when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.handle_auth_user();

-- ---------------------------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_updates enable row level security;
alter table public.update_media enable row level security;
alter table public.project_tokens enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.leads enable row level security;

-- clients
create policy "clients: read own company or admin" on public.clients
  for select to authenticated
  using (id = (select public.current_client_id()) or (select public.is_admin()));
create policy "clients: admin writes" on public.clients
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles
create policy "profiles: read self or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: admin writes" on public.profiles
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- projects
create policy "projects: read own company or admin" on public.projects
  for select to authenticated
  using (client_id = (select public.current_client_id()) or (select public.is_admin()));
create policy "projects: admin writes" on public.projects
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- project_stages
create policy "project_stages: read with the project" on public.project_stages
  for select to authenticated
  using (public.can_read_project(project_id));
create policy "project_stages: admin writes" on public.project_stages
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- project_updates
create policy "project_updates: read with the project" on public.project_updates
  for select to authenticated
  using (public.can_read_project(project_id));
create policy "project_updates: admin writes" on public.project_updates
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- update_media
create policy "update_media: read with the project" on public.update_media
  for select to authenticated
  using (
    exists (
      select 1 from public.project_updates u
      where u.id = update_id and public.can_read_project(u.project_id)
    )
  );
create policy "update_media: admin writes" on public.update_media
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- project_tokens: no policies at all. Only the server, with the service role, reads or writes.
revoke all on table public.project_tokens from anon, authenticated;

-- portfolio_items
create policy "portfolio_items: read published or admin" on public.portfolio_items
  for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "portfolio_items: admin writes" on public.portfolio_items
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- leads: anyone can send one; only admins read and work them.
create policy "leads: anyone sends a new lead" on public.leads
  for insert to anon, authenticated
  with check (status = 'novo');
create policy "leads: admin reads and updates" on public.leads
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Project operations
-- ---------------------------------------------------------------------------------------------

-- Creates a project with the default 5-stage template; the first stage starts right away.
create function public.create_project_with_stages(
  p_client_id uuid,
  p_name text,
  p_type public.project_type,
  p_due_at timestamptz default null
) returns public.projects
language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
begin
  if not public.is_admin() then
    raise exception 'only admins create projects' using errcode = '42501';
  end if;

  insert into public.projects (client_id, name, type, started_at, due_at, current_stage_position)
  values (p_client_id, p_name, p_type, now(), p_due_at, 1)
  returning * into v_project;

  insert into public.project_stages (project_id, position, title, description, status, started_at)
  select
    v_project.id,
    s.position,
    s.title,
    s.description,
    case when s.position = 1 then 'em_andamento' else 'pendente' end::public.stage_status,
    case when s.position = 1 then now() end
  from (values
    (1, 'Organização de ideias', 'Briefing, escopo e cronograma.'),
    (2, 'Design', 'UI/UX e protótipo.'),
    (3, 'Desenvolvimento', 'Construção em entregas curtas, com versões de teste.'),
    (4, 'Testes e homologação', 'Testes e homologação com o cliente.'),
    (5, 'Entrega e publicação', 'Publicação e entrega dos acessos.')
  ) as s (position, title, description);

  return v_project;
end;
$$;

-- Completes the current stage, starts the next one, moves current_stage_position and posts a
-- "marco" update, in one transaction. Returns the new current stage, or null when the last stage
-- was completed (the project is then marked concluido).
create function public.advance_project_stage(p_project_id uuid) returns public.project_stages
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.project_stages;
  v_next public.project_stages;
begin
  if not public.is_admin() then
    raise exception 'only admins advance stages' using errcode = '42501';
  end if;

  perform 1 from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'project % not found', p_project_id using errcode = 'P0002';
  end if;

  select * into v_current from public.project_stages
  where project_id = p_project_id and status = 'em_andamento'
  order by position
  limit 1;
  if not found then
    raise exception 'project % has no stage in progress', p_project_id using errcode = 'P0002';
  end if;

  update public.project_stages
  set status = 'concluida', completed_at = now()
  where id = v_current.id;

  select * into v_next from public.project_stages
  where project_id = p_project_id and position > v_current.position
  order by position
  limit 1;

  if found then
    update public.project_stages
    set status = 'em_andamento', started_at = now()
    where id = v_next.id
    returning * into v_next;

    update public.projects set current_stage_position = v_next.position where id = p_project_id;
  else
    update public.projects set status = 'concluido' where id = p_project_id;
    v_next := null;
  end if;

  insert into public.project_updates (project_id, stage_id, author_id, kind, title, source)
  values (
    p_project_id, v_current.id, (select auth.uid()), 'marco',
    'Etapa concluída: ' || v_current.title, 'manual'
  );

  return v_next;
end;
$$;

revoke execute on function public.create_project_with_stages(uuid, text, public.project_type, timestamptz),
  public.advance_project_stage(uuid) from public, anon;
grant execute on function public.create_project_with_stages(uuid, text, public.project_type, timestamptz),
  public.advance_project_stage(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true), ('project-media', 'project-media', false)
on conflict (id) do nothing;

create policy "portfolio bucket: anyone reads" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio');
create policy "portfolio bucket: admin writes" on storage.objects
  for all to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()))
  with check (bucket_id = 'portfolio' and (select public.is_admin()));

-- Same rule as update_media: a client reads the media of their own company's projects.
create policy "project-media bucket: read with the project" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-media' and public.can_read_project_path(name));
create policy "project-media bucket: admin writes" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-media' and (select public.is_admin()))
  with check (bucket_id = 'project-media' and (select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Realtime: the client panel listens to these (row level security applies to subscribers)
-- ---------------------------------------------------------------------------------------------

alter publication supabase_realtime add table public.projects, public.project_stages, public.project_updates;

-- Local development data, loaded by `supabase db reset`. Never run against production.
--
-- Sign in at /login with password "sdglabs-local":
--   admin@sdglabs.local    admin (the partners' panel)
--   cliente@exemplo.local  client of "Cliente Exemplo", with one project on stage 2

-- ---------------------------------------------------------------------------------------------
-- Company, users and profiles (profiles come from the auth trigger, out of app_metadata)
-- ---------------------------------------------------------------------------------------------

insert into public.clients (id, name, contact_email)
values ('11111111-1111-4111-8111-111111111111', 'Cliente Exemplo', 'cliente@exemplo.local');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  (
    '00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'admin@sdglabs.local',
    extensions.crypt('sdglabs-local', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"], "role": "admin"}',
    '{"full_name": "Admin SDG Labs"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated', 'authenticated', 'cliente@exemplo.local',
    extensions.crypt('sdglabs-local', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"], "role": "client", "client_id": "11111111-1111-4111-8111-111111111111"}',
    '{"full_name": "Cliente Exemplo"}', now(), now(), '', '', '', ''
  );

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users
where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

-- ---------------------------------------------------------------------------------------------
-- A project on stage 2 (Design), with a few updates in the feed
-- ---------------------------------------------------------------------------------------------

insert into public.projects (id, client_id, name, type, status, current_stage_position, started_at, due_at)
values (
  '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
  'App de agendamento', 'app', 'ativo', 2, now() - interval '20 days', now() + interval '40 days'
);

insert into public.project_stages (id, project_id, position, title, description, status, started_at, completed_at)
values
  ('33333333-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 1,
   'Organização de ideias', 'Briefing, escopo e cronograma.', 'concluida',
   now() - interval '20 days', now() - interval '12 days'),
  ('33333333-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 2,
   'Design', 'UI/UX e protótipo.', 'em_andamento', now() - interval '12 days', null),
  ('33333333-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 3,
   'Desenvolvimento', 'Construção em entregas curtas, com versões de teste.', 'pendente', null, null),
  ('33333333-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 4,
   'Testes e homologação', 'Testes e homologação com o cliente.', 'pendente', null, null),
  ('33333333-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 5,
   'Entrega e publicação', 'Publicação e entrega dos acessos.', 'pendente', null, null);

insert into public.project_updates (project_id, stage_id, author_id, kind, title, body, source, created_at)
values
  ('22222222-2222-4222-8222-222222222222', '33333333-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'marco', 'Etapa concluída: Organização de ideias',
   null, 'manual', now() - interval '12 days'),
  ('22222222-2222-4222-8222-222222222222', '33333333-0000-4000-8000-000000000002',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'print', 'Telas da página inicial',
   'Primeira versão das telas de agenda e de confirmação.', 'manual', now() - interval '5 days'),
  ('22222222-2222-4222-8222-222222222222', '33333333-0000-4000-8000-000000000002',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'nota', 'Protótipo navegável disponível',
   'O link do protótipo está nos arquivos do projeto.', 'manual', now() - interval '2 days'),
  ('22222222-2222-4222-8222-222222222222', '33333333-0000-4000-8000-000000000002',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'video', 'Vídeo: fluxo de agendamento',
   null, 'manual', now() - interval '1 day');

-- ---------------------------------------------------------------------------------------------
-- Portfolio: the approved prototype's placeholders (same as src/content/portfolio.ts)
-- ---------------------------------------------------------------------------------------------

insert into public.portfolio_items (
  slug, title, summary, body, category, stack, cover_path, cover_alt, gallery,
  featured, published, sort_order, generative_cover, pixel_art
)
select
  item.slug,
  '[Nome do projeto]',
  '[O que foi feito, em uma frase]',
  E'[O desafio: o que o cliente precisava e por quê.]\n\n[O que a SDG Labs fez, etapa por etapa.]\n\n[O resultado, de preferência com números.]',
  item.category::public.portfolio_category,
  array['[Tecnologia]', '[Tecnologia]', '[Tecnologia]'],
  '/portfolio/' || item.slug || '/cover.png',
  '[Descrição da capa]',
  jsonb_build_array(
    jsonb_build_object('path', '/portfolio/' || item.slug || '/galeria-1.png', 'alt', '[Descrição da imagem 1]'),
    jsonb_build_object('path', '/portfolio/' || item.slug || '/galeria-2.png', 'alt', '[Descrição da imagem 2]')
  ),
  true, true, item.sort_order, item.cover, true
from (values
  ('projeto-site', 'site', 1, 'blocks'),
  ('projeto-app', 'app', 2, 'wave'),
  ('projeto-sistema', 'sistema', 3, 'dither'),
  ('projeto-integracao', 'integracao', 4, 'rings')
) as item (slug, category, sort_order, cover);

-- The name a client confirms when accepting the invitation (/convite) goes to user_metadata
-- through auth.updateUser; profiles.full_name now follows it. Role and company still come only
-- from app_metadata.

create or replace function public.handle_auth_user() returns trigger
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
  v_full_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, full_name, role, client_id)
    values (new.id, v_full_name, v_role, v_client_id);
  else
    update public.profiles
    set role = v_role,
        client_id = v_client_id,
        -- an empty name keeps the one already there
        full_name = coalesce(v_full_name, full_name)
    where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_auth_user() from public;

drop trigger on_auth_user_app_metadata_changed on auth.users;
create trigger on_auth_user_metadata_changed
  after update of raw_app_meta_data, raw_user_meta_data on auth.users
  for each row when (
    old.raw_app_meta_data is distinct from new.raw_app_meta_data
    or old.raw_user_meta_data is distinct from new.raw_user_meta_data
  )
  execute function public.handle_auth_user();

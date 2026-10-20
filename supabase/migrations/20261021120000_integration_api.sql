-- The integration API (POST /api/integrations/updates): a client's own pipeline posts updates
-- to its project with a token. The route checks the token with the service role and then calls
-- this function, which only the service role may run. Same single transaction as the admin's
-- publish_project_update, so the client's live page never sees an update without its media.
-- The API only posts to the feed: advancing a stage stays with the admins.

create function public.publish_integration_update(
  p_token_id uuid,
  p_id uuid,
  p_stage_position smallint,
  p_kind public.update_kind,
  p_title text,
  p_body text default null,
  p_media jsonb default '[]'::jsonb
) returns public.project_updates
language plpgsql security definer set search_path = '' as $$
declare
  v_project_id uuid;
  v_stage_id uuid;
  v_update public.project_updates;
  v_media jsonb;
begin
  select project_id into v_project_id
  from public.project_tokens
  where id = p_token_id and revoked_at is null;
  if not found then
    raise exception 'token % is revoked or unknown', p_token_id using errcode = '28000';
  end if;

  if p_kind = 'marco' then
    raise exception 'milestones are posted by the admins' using errcode = '42501';
  end if;

  -- the stage asked for, or the one in progress
  select id into v_stage_id
  from public.project_stages
  where project_id = v_project_id
    and (position = p_stage_position or (p_stage_position is null and status = 'em_andamento'))
  order by position
  limit 1;
  if p_stage_position is not null and v_stage_id is null then
    raise exception 'project has no stage %', p_stage_position using errcode = '22023';
  end if;

  insert into public.project_updates (id, project_id, stage_id, author_id, kind, title, body, source)
  values (
    p_id, v_project_id, v_stage_id, null, p_kind, btrim(p_title), nullif(btrim(p_body), ''), 'api'
  )
  returning * into v_update;

  for v_media in select value from jsonb_array_elements(p_media) loop
    if left(v_media ->> 'path', 74) <> v_project_id::text || '/' || p_id::text || '/' then
      raise exception 'media % is outside the update folder', v_media ->> 'path'
        using errcode = '22023';
    end if;
    insert into public.update_media (update_id, storage_path, mime_type, width, height)
    values (
      p_id, v_media ->> 'path', v_media ->> 'mime_type', (v_media ->> 'width')::integer,
      (v_media ->> 'height')::integer
    );
  end loop;

  update public.project_tokens set last_used_at = now() where id = p_token_id;
  return v_update;
end;
$$;

revoke execute on function public.publish_integration_update(uuid, uuid, smallint, public.update_kind, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_integration_update(uuid, uuid, smallint, public.update_kind, text, text, jsonb)
  to service_role;

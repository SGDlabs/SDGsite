-- Posting to a project's feed from the admin: the update and its media in one transaction, so
-- the client's page (which refetches when Realtime reports the update) never sees an update
-- whose media are still missing. Files are uploaded first, under <project>/<update>/.

create function public.publish_project_update(
  p_id uuid,
  p_project_id uuid,
  p_stage_id uuid,
  p_kind public.update_kind,
  p_title text,
  p_body text default null,
  p_media jsonb default '[]'::jsonb
) returns public.project_updates
language plpgsql security invoker set search_path = '' as $$
declare
  v_update public.project_updates;
  v_media jsonb;
begin
  if not public.is_admin() then
    raise exception 'only admins publish updates' using errcode = '42501';
  end if;
  if p_stage_id is not null and not exists (
    select 1 from public.project_stages where id = p_stage_id and project_id = p_project_id
  ) then
    raise exception 'stage % is not part of project %', p_stage_id, p_project_id
      using errcode = '22023';
  end if;

  insert into public.project_updates (id, project_id, stage_id, author_id, kind, title, body, source)
  values (
    p_id, p_project_id, p_stage_id, (select auth.uid()), p_kind, btrim(p_title),
    nullif(btrim(p_body), ''), 'manual'
  )
  returning * into v_update;

  for v_media in select value from jsonb_array_elements(p_media) loop
    if left(v_media ->> 'path', 74) <> p_project_id::text || '/' || p_id::text || '/' then
      raise exception 'media % is outside the update folder', v_media ->> 'path'
        using errcode = '22023';
    end if;
    insert into public.update_media (update_id, storage_path, mime_type, width, height, duration_s)
    values (
      p_id, v_media ->> 'path', v_media ->> 'mime_type', (v_media ->> 'width')::integer,
      (v_media ->> 'height')::integer, (v_media ->> 'duration_s')::numeric
    );
  end loop;

  return v_update;
end;
$$;

revoke execute on function public.publish_project_update(uuid, uuid, uuid, public.update_kind, text, text, jsonb)
  from public, anon;
grant execute on function public.publish_project_update(uuid, uuid, uuid, public.update_kind, text, text, jsonb)
  to authenticated;

-- What the private bucket accepts: prints and screen recordings, up to 50 MB (the local
-- [storage] limit; the hosted project's global limit must allow it too).
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
where id = 'project-media';

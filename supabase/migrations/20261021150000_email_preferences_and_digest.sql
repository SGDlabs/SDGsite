-- E-mails about a project's feed: at most one per project every 2 hours, grouping what was
-- posted, and only to client users who did not silence them in /painel/conta.

alter table public.profiles add column notify_updates boolean not null default true;
alter table public.projects add column digest_sent_at timestamptz;

-- profiles only take admin writes; this is the one thing a user changes on their own row.
create function public.set_my_email_preferences(p_notify_updates boolean) returns void
language sql security definer set search_path = '' as $$
  update public.profiles set notify_updates = p_notify_updates where id = (select auth.uid());
$$;

revoke execute on function public.set_my_email_preferences(boolean) from public, anon;
grant execute on function public.set_my_email_preferences(boolean) to authenticated;

-- Claims the right to send a project's digest: allowed when the last one is older than p_every
-- and something new (not a milestone, which has its own e-mail) was posted since. Marks the
-- digest as sent in the same statement, so two calls at once never both send. `since` is where
-- the digest starts (a day back for a project that never had one).
create function public.claim_project_digest(p_project_id uuid, p_every interval default '2 hours')
returns table (allowed boolean, since timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_previous timestamptz;
  v_since timestamptz;
begin
  select digest_sent_at into v_previous from public.projects where id = p_project_id for update;
  if not found or (v_previous is not null and v_previous > now() - p_every) then
    return query select false, null::timestamptz;
    return;
  end if;

  v_since := coalesce(v_previous, now() - interval '1 day');
  if not exists (
    select 1 from public.project_updates
    where project_id = p_project_id and kind <> 'marco' and created_at > v_since
  ) then
    return query select false, null::timestamptz;
    return;
  end if;

  update public.projects set digest_sent_at = now() where id = p_project_id;
  return query select true, v_since;
end;
$$;

revoke execute on function public.claim_project_digest(uuid, interval) from public, anon, authenticated;
grant execute on function public.claim_project_digest(uuid, interval) to service_role;

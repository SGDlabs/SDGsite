-- Advances the seed project one stage, as the seed admin would from the admin panel
-- (advance_project_stage only runs for admins: the first part signs the query in as the admin).
-- Watch /painel/projetos/2222… as the client: the pulse moves without a reload. Local only;
-- `pnpm supabase db reset` restores the seed.
--
--   pnpm supabase db query --local -f supabase/snippets/avancar-etapa.sql
select stage.position, stage.title, stage.status
from (
  select set_config(
    'request.jwt.claims',
    '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}',
    true
  ) as claims
) as as_admin
cross join lateral (
  select * from public.advance_project_stage('22222222-2222-4222-8222-222222222222')
  where as_admin.claims is not null
) as stage;

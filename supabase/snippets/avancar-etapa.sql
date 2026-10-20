-- Advances the seed project one stage, as the seed admin would from the admin panel
-- (advance_project_stage only runs for admins). Watch /painel/projetos/2222… as the client:
-- the pulse moves without a reload. Local only; `pnpm supabase db reset` restores the seed.
--
--   pnpm supabase db query --local -f supabase/snippets/avancar-etapa.sql
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}',
  true
);
select position, title, status
from public.advance_project_stage('22222222-2222-4222-8222-222222222222');
commit;

# Runbook

O que fazer em cada situação, passo a passo. A configuração inicial está em [deploy.md](deploy.md).

## Dar acesso a um cliente novo

1. **Admin > Clientes > Novo cliente**: nome da empresa (CNPJ, e-mail de contato e telefone são
   opcionais).
2. Na página do cliente, **Convidar usuário**: nome e e-mail de cada pessoa. Elas recebem o convite
   (vale 24 horas), confirmam o nome e escolhem a senha.
3. **Novo projeto** (na página do cliente ou em **Projetos**): nome, tipo e previsão de entrega. Ele
   nasce com as 5 etapas, a primeira em andamento.
4. Se o repositório do cliente for publicar prints a cada deploy: na página do projeto,
   **Integração > Gerar token** e siga [integracao.md](integracao.md).

Convite expirou? Convide de novo o mesmo e-mail: se o Supabase disser que o e-mail já existe, apague
o usuário (próximo item) e convide outra vez.

## Tirar o acesso de alguém

A pessoa saiu da empresa do cliente, ou o contrato acabou:

1. Supabase > **Authentication > Users**, procure o e-mail, **Delete user**. O perfil vai junto e a
   sessão aberta para de funcionar na renovação seguinte (até 1 hora; para cortar na hora, use
   **Sign out user** antes de apagar).
2. Os projetos e o histórico da empresa continuam no admin.

## Revogar um token de integração vazado

1. **Admin > Projetos >** o projeto **> Integração**, **Revogar** no token. A próxima chamada com ele
   já recebe `401 revoked_token`.
2. **Gerar token** de novo e troque o segredo `SDG_TOKEN` no repositório do cliente.
3. Confira o feed em **Atualizações publicadas**: o que foi publicado com o token vazado aparece com
   origem "api". Exclua o que não for de vocês.
4. Procure onde ele vazou (um log público, um commit) e apague: tokens começam com `sdg_`, o que
   facilita a busca.

## Trocar uma chave que vazou

| Chave                     | Onde trocar                                                          | Depois                                                           |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Chave de serviço Supabase | Supabase > Project Settings > API Keys (gerar nova, revogar a velha) | Vercel `SUPABASE_SERVICE_ROLE_KEY` e **Redeploy**                |
| Senha do banco            | Supabase > Project Settings > Database > Reset password              | Segredo `SUPABASE_DB_PASSWORD` no GitHub (ambiente `production`) |
| Token de acesso Supabase  | Supabase > Account > Access Tokens                                   | Segredo `SUPABASE_ACCESS_TOKEN` no GitHub                        |
| Chave do Resend           | Resend > API Keys                                                    | Vercel `RESEND_API_KEY`, SMTP do Supabase, **Redeploy**          |
| `CRON_SECRET`             | gere outro texto aleatório                                           | Vercel e segredo `CRON_SECRET` do GitHub, **Redeploy**           |

A chave pública do Supabase (`anon`/publishable) pode ser vista por qualquer visitante: quem protege
os dados é a RLS. Só troque se for trocar a de serviço junto.

## Backups

- **Banco**: no plano Pro, o Supabase faz backup diário e guarda 7 dias (**Database > Backups**).
  Com o add-on de PITR, dá para voltar a qualquer minuto. No Free não há backup: faça um dump antes
  de qualquer mudança arriscada:

  ```bash
  pnpm supabase db dump --project-ref <ref> --password <senha> -f backup-schema.sql
  pnpm supabase db dump --project-ref <ref> --password <senha> --data-only -f backup-dados.sql
  ```

  Guarde os arquivos fora do repositório (ele é público): têm dados de clientes.

- **Arquivos** (prints, vídeos, imagens do portfólio) ficam no Storage e **não entram** no backup
  do banco. Para uma cópia, baixe os buckets `project-media` e `portfolio` (o Supabase expõe o
  Storage pelo protocolo S3, que qualquer cliente S3 sincroniza).

## Restaurar o banco

1. Supabase > **Database > Backups** (ou **Point in Time**), escolha o momento e restaure. O projeto
   fica fora do ar alguns minutos.
2. Depois, rode **Actions > Database migrations > Run workflow**: se o backup for de antes de uma
   migration, ela é aplicada de novo.
3. Arquivos enviados depois do momento restaurado continuam no Storage, mas sem linha no banco: não
   aparecem no feed. Prints que o banco restaurado cita mas que foram apagados depois aparecem
   quebrados; exclua essas atualizações no admin.
4. Avise os clientes se alguma atualização sumiu.

## O site quebrou depois de um deploy

1. Vercel > **Deployments**, no último deploy bom: **Instant Rollback**. Leva segundos.
2. Corrija numa branch, com PR e CI, como sempre.
3. Se o problema veio de uma migration: não há "desfazer". Escreva uma migration nova que corrija e
   passe pelo mesmo fluxo. O rollback da Vercel não mexe no banco, então confira se a versão
   anterior do site funciona com o banco novo.

## A migration falhou no GitHub Actions

1. Abra o log de **Database migrations**: o passo "Migrations that will run" mostra quais iam
   entrar, e o erro mostra a linha do SQL.
2. O `db push` roda cada migration numa transação: a que falhou não deixou nada pela metade, e as
   seguintes não rodaram.
3. Corrija com uma migration nova (nunca edite uma que já foi aplicada) e faça o PR.

## E-mails não chegam

1. Resend > **Emails**: o e-mail aparece lá? Com que status (entregue, devolvido, spam)?
2. Não aparece:
   - convite e senha: Supabase > **Logs > Auth** e **Authentication > Emails > SMTP Settings**;
   - etapa, novidades e leads: Vercel > **Logs**, procure `[email]` (sem `RESEND_API_KEY`, o log diz
     "not sent"). O resumo de novidades sai no máximo a cada 2 horas por projeto, e só para quem não
     silenciou em **Sua conta**.
3. Vai para o spam: confira SPF, DKIM e DMARC no Resend (**Domains**).

## O cliente não vê a mudança ao vivo

1. Peça para recarregar a página: se aparecer, o dado está certo e foi só o tempo real.
2. Ao lado do tipo do projeto aparece "Ao vivo" quando a conexão está ativa, ou "Reconectando". Rede
   corporativa às vezes bloqueia WebSocket; a página volta a se atualizar sozinha quando reconecta.
3. Supabase > **Database > Publications > supabase_realtime** deve listar `projects`,
   `project_stages` e `project_updates`.

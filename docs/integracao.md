# Integração: o projeto do cliente publica no painel

Com um token, o repositório do cliente publica atualizações no feed do projeto: a cada deploy,
prints do preview e o link para testar; depois de uma bateria de testes, uma nota. O cliente vê na
hora, na área do cliente, como qualquer atualização.

A API **só publica no feed**. Avançar etapa, criar marco e mexer no projeto continuam sendo do painel
admin: uma integração com problema nunca muda a etapa que o cliente vê.

## 1. Gerar o token

No admin, abra o projeto e vá em **Integração** > **Gerar token**. O token (`sdg_…`) aparece uma
única vez: guarde-o como segredo do repositório do cliente (`SDG_TOKEN`). No banco fica só o hash
SHA-256 dele.

Na mesma tela você vê quando cada token foi usado pela última vez e pode **revogar** um token: a
próxima chamada com ele já é recusada. Token vazado? Revogue e gere outro.

## 2. A chamada

```
POST https://[domínio]/api/integrations/updates
Authorization: Bearer sdg_…
```

| Campo   | Obrigatório | O que é                                                                   |
| ------- | ----------- | ------------------------------------------------------------------------- |
| `kind`  | sim         | `nota`, `print`, `video` ou `deploy` (marcos são do admin)                |
| `title` | sim         | até 200 caracteres                                                        |
| `body`  | não         | texto, até 4000 caracteres; links aparecem como texto                     |
| `stage` | não         | posição da etapa (1 a 7); sem ele, vai para a etapa em andamento          |
| `files` | não         | só em `multipart/form-data`: imagens ou vídeos, até 12, **4 MB no total** |

Só texto, em JSON:

```bash
curl -X POST "https://[domínio]/api/integrations/updates" \
  -H "Authorization: Bearer $SDG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind": "nota", "title": "Testes de ponta a ponta passaram", "stage": 3}'
```

Com prints, em multipart (um campo `files` por arquivo):

```bash
curl -X POST "https://[domínio]/api/integrations/updates" \
  -H "Authorization: Bearer $SDG_TOKEN" \
  -F kind=deploy \
  -F "title=Deploy: nova página de contato" \
  -F "body=Preview: https://meu-app-git-contato.vercel.app" \
  -F files=@home-desktop.jpg \
  -F files=@home-celular.jpg
```

Formatos aceitos: PNG, JPG, WebP, GIF e AVIF; MP4, WebM e MOV. Os 4 MB por chamada vêm do limite
de corpo das funções da Vercel: prints em JPEG cabem com folga; para um vídeo longo, mande o link
no `body`.

### Respostas

`201` com a atualização criada:

```json
{ "id": "…", "project_id": "…", "kind": "deploy", "title": "Deploy: …", "media": 2 }
```

Erros vêm sempre como `{ "error": { "code": "…", "message": "…" } }`:

| Status | `code`                   | Quando                                                                   |
| ------ | ------------------------ | ------------------------------------------------------------------------ |
| 400    | `invalid_request`        | campo faltando ou inválido (a mensagem diz qual)                         |
| 400    | `invalid_stage`          | o projeto não tem a etapa pedida                                         |
| 400    | `too_many_files`         | mais de 12 arquivos                                                      |
| 401    | `missing_token`          | sem `Authorization: Bearer sdg_…`                                        |
| 401    | `invalid_token`          | token que não existe                                                     |
| 401    | `revoked_token`          | token revogado no admin                                                  |
| 413    | `payload_too_large`      | arquivos somando mais de 4 MB                                            |
| 415    | `unsupported_media_type` | corpo que não é JSON nem multipart                                       |
| 415    | `unsupported_file_type`  | arquivo que não é imagem nem vídeo                                       |
| 429    | `rate_limited`           | mais de 30 chamadas em 10 minutos com o mesmo token (veja `Retry-After`) |
| 502    | `upload_failed`          | um arquivo não foi guardado; nada foi publicado                          |

Ou a atualização entra inteira, com todos os arquivos, ou nada entra.

## 3. Prints a cada deploy, com GitHub Actions

No repositório **do cliente**:

1. Copie [`integracao/sdg-update.yml`](integracao/sdg-update.yml) para `.github/workflows/sdg-update.yml`
   e [`integracao/prints.mjs`](integracao/prints.mjs) para `.github/sdg/prints.mjs`.
2. Em **Settings > Secrets and variables > Actions**, crie o segredo `SDG_TOKEN` com o token.
3. No workflow, troque `[domínio da SDG Labs]` e ajuste `PAGES` (as páginas a fotografar).

A Vercel avisa o GitHub a cada deploy (o evento `deployment_status`). Quando um deploy termina, o
workflow abre cada página do preview num desktop (1440 × 900) e num celular (390 × 844), tira um
print do que aparece primeiro e publica tudo como uma atualização `deploy`, com o link do preview e
o commit. Usa o Chrome que já vem no runner, sem baixar navegador.

## Para quem mantém o SDG Site

- Rota: `src/app/api/integrations/updates/route.ts`. Confere o token pelo hash com a service role,
  guarda os arquivos em `project-media/<projeto>/<atualização>/` e publica com
  `publish_integration_update`, uma função que só a service role executa e que grava a atualização
  e as mídias numa transação (`source = 'api'`).
- O limite de chamadas é por instância do servidor, em memória: serve para conter um loop de CI,
  não como defesa (quem defende é o token).
- Testes: `tests/e2e/integration-api.spec.ts` (token válido, revogado, inexistente, arquivo grande
  demais, tipo errado, marco) e `supabase/tests/rls.test.ts`.

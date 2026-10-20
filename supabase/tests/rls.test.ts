import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase, type TestDatabase } from "./database";

// Two companies, one user each, one project each, plus an admin. Random ids so the suite can run
// against a shared database (CI) and clean up after itself.
const ids = {
  admin: randomUUID(),
  userA: randomUUID(),
  userB: randomUUID(),
  clientA: randomUUID(),
  clientB: randomUUID(),
  projectA: randomUUID(),
  projectB: randomUUID(),
  updateA: randomUUID(),
  updateB: randomUUID(),
  portfolioPublished: randomUUID(),
  portfolioDraft: randomUUID(),
};
const tag = ids.admin.slice(0, 8);

let db: TestDatabase;

async function addUser(id: string, appMeta: object, userMeta: object = {}) {
  await db.sql(
    `insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values ($1, $2, $3, $4)`,
    [id, `${id}@test.local`, JSON.stringify(appMeta), JSON.stringify(userMeta)],
  );
}

async function addProject(project: string, client: string, update: string) {
  await db.sql(
    `insert into public.projects (id, client_id, name, type, current_stage_position)
     values ($1, $2, $3, 'app', 2)`,
    [project, client, `Projeto ${project.slice(0, 8)}`],
  );
  await db.sql(
    `insert into public.project_stages (project_id, position, title, status) values
       ($1, 1, 'Organização de ideias', 'concluida'),
       ($1, 2, 'Design', 'em_andamento'),
       ($1, 3, 'Desenvolvimento', 'pendente')`,
    [project],
  );
  await db.sql(
    `insert into public.project_updates (id, project_id, kind, title) values ($1, $2, 'print', 'Telas')`,
    [update, project],
  );
  await db.sql(
    `insert into public.update_media (update_id, storage_path, mime_type) values ($1, $2, 'image/png')`,
    [update, `${project}/${update}/tela.png`],
  );
  await db.sql(`insert into storage.objects (bucket_id, name) values ('project-media', $1)`, [
    `${project}/${update}/tela.png`,
  ]);
}

beforeAll(async () => {
  db = await openTestDatabase();
  await db.sql(
    `insert into public.clients (id, name) values ($1, 'Empresa A'), ($2, 'Empresa B')`,
    [ids.clientA, ids.clientB],
  );
  await addUser(ids.admin, { role: "admin" });
  await addUser(ids.userA, { role: "client", client_id: ids.clientA });
  await addUser(ids.userB, { role: "client", client_id: ids.clientB });
  await addProject(ids.projectA, ids.clientA, ids.updateA);
  await addProject(ids.projectB, ids.clientB, ids.updateB);
  await db.sql(
    `insert into public.portfolio_items (id, slug, title, summary, category, published) values
       ($1, $3, 'Publicado', 'Resumo', 'site', true),
       ($2, $4, 'Rascunho', 'Resumo', 'app', false)`,
    [ids.portfolioPublished, ids.portfolioDraft, `publicado-${tag}`, `rascunho-${tag}`],
  );
}, 60_000);

afterAll(async () => {
  if (!db) return;
  await db.sql(`delete from storage.objects where name like $1 or name like $2`, [
    `${ids.projectA}/%`,
    `${ids.projectB}/%`,
  ]);
  await db.sql(`delete from public.portfolio_items where id = any($1)`, [
    [ids.portfolioPublished, ids.portfolioDraft],
  ]);
  await db.sql(`delete from public.leads where email like $1`, [`%@${tag}.test`]);
  await db.sql(`delete from public.clients where id = any($1)`, [[ids.clientA, ids.clientB]]);
  await db.sql(`delete from auth.users where email like '%@test.local' and id = any($1)`, [
    [ids.admin, ids.userA, ids.userB],
  ]);
  await db.close();
});

const projectIds = [ids.projectA, ids.projectB];

describe("profiles", () => {
  it("are created from app_metadata", async () => {
    const rows = await db.sql<{ id: string; role: string; client_id: string | null }>(
      `select id, role, client_id from public.profiles where id = any($1) order by role`,
      [[ids.admin, ids.userA]],
    );
    expect(rows).toEqual([
      { id: ids.admin, role: "admin", client_id: null },
      { id: ids.userA, role: "client", client_id: ids.clientA },
    ]);
  });

  it("never take role or company from user_metadata, which users can edit", async () => {
    const id = randomUUID();
    await addUser(id, {}, { role: "admin", client_id: ids.clientA });
    const [profile] = await db.sql(`select role, client_id from public.profiles where id = $1`, [
      id,
    ]);
    expect(profile).toEqual({ role: "client", client_id: null });
    await db.sql(`delete from auth.users where id = $1`, [id]);
  });

  it("follow app_metadata changes", async () => {
    const id = randomUUID();
    await addUser(id, {});
    await db.sql(`update auth.users set raw_app_meta_data = $2 where id = $1`, [
      id,
      JSON.stringify({ role: "client", client_id: ids.clientB }),
    ]);
    const [profile] = await db.sql(`select client_id from public.profiles where id = $1`, [id]);
    expect(profile).toEqual({ client_id: ids.clientB });
    await db.sql(`delete from auth.users where id = $1`, [id]);
  });
});

describe("a client", () => {
  it("reads only their own company's project", async () => {
    const rows = await db.as(ids.userA, (sql) =>
      sql<{ id: string }>(`select id from public.projects where id = any($1)`, [projectIds]),
    );
    expect(rows.map((row) => row.id)).toEqual([ids.projectA]);
  });

  it("does NOT read another company's stages, updates, media or files", async () => {
    const counts = await db.as(ids.userA, async (sql) => ({
      stages: await sql(`select 1 from public.project_stages where project_id = $1`, [
        ids.projectB,
      ]),
      updates: await sql(`select 1 from public.project_updates where project_id = $1`, [
        ids.projectB,
      ]),
      media: await sql(`select 1 from public.update_media where update_id = $1`, [ids.updateB]),
      files: await sql(
        `select 1 from storage.objects where bucket_id = 'project-media' and name like $1`,
        [`${ids.projectB}/%`],
      ),
      ownFiles: await sql(
        `select 1 from storage.objects where bucket_id = 'project-media' and name like $1`,
        [`${ids.projectA}/%`],
      ),
    }));
    expect(counts.stages).toHaveLength(0);
    expect(counts.updates).toHaveLength(0);
    expect(counts.media).toHaveLength(0);
    expect(counts.files).toHaveLength(0);
    expect(counts.ownFiles).toHaveLength(1);
  });

  it("reads only their own company and profile", async () => {
    const rows = await db.as(ids.userA, async (sql) => ({
      clients: await sql<{ id: string }>(`select id from public.clients where id = any($1)`, [
        [ids.clientA, ids.clientB],
      ]),
      profiles: await sql<{ id: string }>(`select id from public.profiles where id = any($1)`, [
        [ids.userA, ids.userB, ids.admin],
      ]),
    }));
    expect(rows.clients.map((row) => row.id)).toEqual([ids.clientA]);
    expect(rows.profiles.map((row) => row.id)).toEqual([ids.userA]);
  });

  it("cannot change a project, not even their own", async () => {
    const changed = await db.as(ids.userA, (sql) =>
      sql(`update public.projects set name = 'Hack' where id = $1 returning id`, [ids.projectA]),
    );
    expect(changed).toHaveLength(0);
  });

  it("cannot advance a stage", async () => {
    await expect(
      db.as(ids.userA, (sql) => sql(`select public.advance_project_stage($1)`, [ids.projectA])),
    ).rejects.toThrow(/only admins/);
  });

  it("cannot read integration tokens", async () => {
    await expect(
      db.as(ids.userA, (sql) => sql(`select * from public.project_tokens`)),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("an admin", () => {
  it("reads every project", async () => {
    const rows = await db.as(ids.admin, (sql) =>
      sql(`select id from public.projects where id = any($1)`, [projectIds]),
    );
    expect(rows).toHaveLength(2);
  });

  it("advances a stage: the pulse moves and a milestone is posted", async () => {
    const result = await db.as(ids.admin, async (sql) => {
      const [next] = await sql<{ advance_project_stage: { position: number } }>(
        `select public.advance_project_stage($1)`,
        [ids.projectA],
      );
      return {
        next,
        project: await sql(`select current_stage_position from public.projects where id = $1`, [
          ids.projectA,
        ]),
        stages: await sql(
          `select position, status from public.project_stages where project_id = $1 order by position`,
          [ids.projectA],
        ),
        milestones: await sql(
          `select title from public.project_updates where project_id = $1 and kind = 'marco'`,
          [ids.projectA],
        ),
      };
    });
    expect(result.project).toEqual([{ current_stage_position: 3 }]);
    expect(result.stages).toEqual([
      { position: 1, status: "concluida" },
      { position: 2, status: "concluida" },
      { position: 3, status: "em_andamento" },
    ]);
    expect(result.milestones).toEqual([{ title: "Etapa concluída: Design" }]);
  });

  it("creates a project with the 5-stage template", async () => {
    const stages = await db.as(ids.admin, async (sql) => {
      const [created] = await sql<{ id: string }>(
        `select (public.create_project_with_stages($1, 'Novo site', 'site')).id as id`,
        [ids.clientA],
      );
      return sql(
        `select position, title, status from public.project_stages where project_id = $1 order by position`,
        [created!.id],
      );
    });
    expect(stages).toEqual([
      { position: 1, title: "Organização de ideias", status: "em_andamento" },
      { position: 2, title: "Design", status: "pendente" },
      { position: 3, title: "Desenvolvimento", status: "pendente" },
      { position: 4, title: "Testes e homologação", status: "pendente" },
      { position: 5, title: "Entrega e publicação", status: "pendente" },
    ]);
  });

  it("still cannot read integration tokens from the browser", async () => {
    await expect(
      db.as(ids.admin, (sql) => sql(`select * from public.project_tokens`)),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("a visitor", () => {
  it("reads only published portfolio items", async () => {
    const rows = await db.as(null, (sql) =>
      sql<{ title: string }>(`select title from public.portfolio_items where id = any($1)`, [
        [ids.portfolioPublished, ids.portfolioDraft],
      ]),
    );
    expect(rows.map((row) => row.title)).toEqual(["Publicado"]);
  });

  it("reads no project, stage, update or company", async () => {
    const rows = await db.as(null, async (sql) => [
      ...(await sql(`select id from public.projects where id = any($1)`, [projectIds])),
      ...(await sql(`select id from public.project_stages where project_id = any($1)`, [
        projectIds,
      ])),
      ...(await sql(`select id from public.project_updates where project_id = any($1)`, [
        projectIds,
      ])),
      ...(await sql(`select id from public.clients where id = any($1)`, [
        [ids.clientA, ids.clientB],
      ])),
    ]);
    expect(rows).toHaveLength(0);
  });

  it("sends a lead but cannot read leads back", async () => {
    const rows = await db.as(null, async (sql) => {
      await sql(
        `insert into public.leads (name, email, service_interest) values ('Maria', $1, '{site}')`,
        [`maria@${tag}.test`],
      );
      return sql(`select id from public.leads`);
    });
    expect(rows).toHaveLength(0);
  });

  it("cannot send a lead that skips the inbox", async () => {
    await expect(
      db.as(null, (sql) =>
        sql(`insert into public.leads (name, email, status) values ('Maria', $1, 'fechado')`, [
          `maria@${tag}.test`,
        ]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

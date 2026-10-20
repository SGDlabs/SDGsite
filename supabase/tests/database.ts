// Test database for the row level security suite.
// Without DATABASE_URL it boots PGlite (Postgres in WebAssembly) with a Supabase stand-in and the
// migrations; with DATABASE_URL (CI, after `supabase db reset`) it uses the real local Supabase.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const SUPABASE_DIR = join(import.meta.dirname, "..");

export type Sql = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

export interface TestDatabase {
  /** As the database owner: bypasses row level security, for fixtures and checks. */
  sql: Sql;
  /**
   * Runs `fn` as a visitor (userId null → role anon) or as that signed-in user (role
   * authenticated), inside a transaction that is always rolled back.
   */
  as<T>(userId: string | null, fn: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

async function impersonate(
  run: (text: string, params?: unknown[]) => Promise<unknown>,
  userId: string | null,
) {
  const claims = JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" });
  await run(`set local role ${userId ? "authenticated" : "anon"}`);
  await run(
    "select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)",
    [claims, userId ?? ""],
  );
}

function migrations() {
  const dir = join(SUPABASE_DIR, "migrations");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(dir, file), "utf8"));
}

export async function openTestDatabase(): Promise<TestDatabase> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const sql: Sql = async (text, params) => (await client.query(text, params)).rows;
    return {
      sql,
      async as(userId, fn) {
        await client.query("begin");
        try {
          await impersonate((text, params) => client.query(text, params), userId);
          return await fn(sql);
        } finally {
          await client.query("rollback");
        }
      },
      close: () => client.end(),
    };
  }

  const db = new PGlite();
  await db.exec(readFileSync(join(SUPABASE_DIR, "tests", "bootstrap.sql"), "utf8"));
  for (const migration of migrations()) await db.exec(migration);
  const sql: Sql = async <T>(text: string, params?: unknown[]) =>
    (await db.query<T>(text, params)).rows;
  return {
    sql,
    async as(userId, fn) {
      await db.exec("begin");
      try {
        await impersonate((text, params) => db.query(text, params), userId);
        return await fn(sql);
      } finally {
        await db.exec("rollback");
      }
    },
    close: () => db.close(),
  };
}

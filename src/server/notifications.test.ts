import { afterEach, describe, expect, it, vi } from "vitest";

// Supabase (service role) and the sender are replaced; what is under test is who gets what.

const sendEmail = vi.fn();
const getUserById = vi.fn();
const rpcSingle = vi.fn();
const tables: Record<string, unknown> = {};
const filters: { table: string; column: string; value: unknown }[] = [];

/** A tiny stand-in for the query builder: every call chains, awaiting gives the table's rows. */
function query(table: string) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "neq", "gt", "order", "in"]) builder[method] = () => builder;
  builder.eq = (column: string, value: unknown) => {
    filters.push({ table, column, value });
    return builder;
  };
  builder.single = async () => ({ data: tables[table] });
  builder.then = (resolve: (value: unknown) => unknown) => resolve({ data: tables[table] });
  return builder;
}

vi.mock("@/lib/email/send", () => ({ sendEmail, teamInbox: () => ["socios@sdglabs.test"] }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: query,
    rpc: () => ({ single: rpcSingle }),
    auth: { admin: { getUserById } },
  }),
}));

const { clientRecipients, notifyNewLead, notifyStageCompleted, sendProjectDigest } =
  await import("./notifications");

const confirmed = (id: string) => ({
  data: { user: { id, email: `${id}@empresa.test`, email_confirmed_at: "2026-10-01T00:00:00Z" } },
});

afterEach(() => {
  vi.resetAllMocks();
  filters.length = 0;
  for (const key of Object.keys(tables)) delete tables[key];
});

describe("clientRecipients", () => {
  it("takes only people who accepted the invitation", async () => {
    tables.profiles = [
      { id: "ana", full_name: "Ana" },
      { id: "bia", full_name: null },
    ];
    getUserById.mockImplementation(async (id: string) =>
      id === "ana"
        ? confirmed("ana")
        : { data: { user: { id, email: "bia@empresa.test", email_confirmed_at: null } } },
    );
    expect(await clientRecipients("c1")).toEqual([{ email: "ana@empresa.test", name: "Ana" }]);
  });

  it("asks for the people who keep feed e-mails on, when it is about the feed", async () => {
    tables.profiles = [];
    await clientRecipients("c1", { onlyUpdates: true });
    expect(filters).toContainEqual({ table: "profiles", column: "notify_updates", value: true });
  });
});

describe("notifyStageCompleted", () => {
  it("tells each person which stage ended and which began", async () => {
    tables.projects = {
      id: "p1",
      name: "App",
      client_id: "c1",
      project_stages: [
        { position: 2, title: "Design", status: "concluida" },
        { position: 1, title: "Ideias", status: "concluida" },
        { position: 3, title: "Desenvolvimento", status: "em_andamento" },
      ],
    };
    tables.profiles = [{ id: "ana", full_name: "Ana" }];
    getUserById.mockResolvedValue(confirmed("ana"));

    await notifyStageCompleted({
      projectId: "p1",
      next: { position: 3, title: "Desenvolvimento" },
      origin: "https://sdglabs.test",
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]![0]).toMatchObject({
      to: ["ana@empresa.test"],
      subject: "App: etapa 3 começou",
    });
    expect(sendEmail.mock.calls[0]![0].body.props).toMatchObject({
      completed: { position: 2, title: "Design" },
      url: "https://sdglabs.test/painel/projetos/p1",
    });
  });

  it("never throws, even when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getUserById.mockRejectedValue(new Error("down"));
    tables.projects = {
      id: "p1",
      name: "App",
      client_id: "c1",
      project_stages: [{ position: 1, title: "A" }],
    };
    tables.profiles = [{ id: "ana", full_name: null }];
    await expect(
      notifyStageCompleted({ projectId: "p1", next: null, origin: "https://sdglabs.test" }),
    ).resolves.toBeUndefined();
  });
});

describe("sendProjectDigest", () => {
  it("does nothing when the two hours are not up (or nothing is new)", async () => {
    rpcSingle.mockResolvedValue({ data: { allowed: false, since: null } });
    expect(await sendProjectDigest({ projectId: "p1", origin: "https://sdglabs.test" })).toBe(
      false,
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("groups what was posted since the last digest", async () => {
    rpcSingle.mockResolvedValue({ data: { allowed: true, since: "2026-10-20T10:00:00Z" } });
    tables.projects = { id: "p1", name: "App", client_id: "c1" };
    tables.project_updates = [
      { kind: "print", title: "Telas", created_at: "2026-10-20T11:00:00Z" },
      { kind: "deploy", title: "Deploy", created_at: "2026-10-20T12:00:00Z" },
    ];
    tables.profiles = [{ id: "ana", full_name: "Ana" }];
    getUserById.mockResolvedValue(confirmed("ana"));

    expect(await sendProjectDigest({ projectId: "p1", origin: "https://sdglabs.test" })).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]![0].subject).toBe("App: 2 novidades");
    expect(
      sendEmail.mock.calls[0]![0].body.props.updates.map((u: { kind: string }) => u.kind),
    ).toEqual(["Prints", "Deploy"]);
  });
});

describe("notifyNewLead", () => {
  it("goes to the partners' inbox with the interest in words", async () => {
    await notifyNewLead({
      lead: { name: "Maria", email: "maria@empresa.test", types: ["site", "nao-sei"] },
      origin: "https://sdglabs.test",
    });
    expect(sendEmail.mock.calls[0]![0]).toMatchObject({
      to: ["socios@sdglabs.test"],
      subject: "Novo lead: Maria",
    });
    expect(sendEmail.mock.calls[0]![0].body.props.interest).toEqual(["Site", "Ainda não sabe"]);
  });
});

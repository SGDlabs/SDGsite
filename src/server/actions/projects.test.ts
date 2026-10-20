import { afterEach, describe, expect, it, vi } from "vitest";

// Supabase and requireRole are replaced; what is under test is what reaches the database.

const requireRole = vi.fn();
const rpc = vi.fn();
const createSignedUploadUrl = vi.fn();

const notifyStageCompleted = vi.fn();
const sendProjectDigest = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// work scheduled with after() runs right away here
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://sdglabs.test" }));
vi.mock("@/server/notifications", () => ({ notifyStageCompleted, sendProjectDigest }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc,
    storage: { from: () => ({ createSignedUploadUrl }) },
  }),
}));

const { advanceStage, prepareUpload, publishUpdate } = await import("./projects");

const PROJECT = "22222222-2222-4222-8222-222222222222";
const UPDATE = "44444444-0000-4000-8000-000000000009";

afterEach(() => {
  vi.resetAllMocks();
});

describe("prepareUpload", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(prepareUpload({ projectId: PROJECT, files: [] })).rejects.toThrow();
    expect(requireRole).toHaveBeenCalledWith("admin");
  });

  it("refuses files the bucket would refuse", async () => {
    const pdf = await prepareUpload({
      projectId: PROJECT,
      files: [{ name: "contrato.pdf", type: "application/pdf" as never, size: 1000 }],
    });
    expect(pdf).toEqual({
      ok: false,
      formError: "Envie imagens (PNG, JPG, WebP, GIF, AVIF) ou vídeos (MP4, WebM, MOV).",
    });
    const huge = await prepareUpload({
      projectId: PROJECT,
      files: [{ name: "demo.mp4", type: "video/mp4", size: 60 * 1024 * 1024 }],
    });
    expect(huge).toEqual({ ok: false, formError: "Cada arquivo pode ter até 50 MB." });
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("signs one upload per file inside the update's folder, with readable names", async () => {
    createSignedUploadUrl.mockImplementation(async (path: string) => ({
      data: { signedUrl: `https://storage.test/${path}?token=t` },
      error: null,
    }));
    const result = await prepareUpload({
      projectId: PROJECT,
      files: [
        { name: "Tela Inicial (1).PNG", type: "image/png", size: 1000 },
        { name: "Fluxo de agendamento.mov", type: "video/quicktime", size: 1000 },
      ],
    });
    if (!result.ok) throw new Error(result.formError);
    expect(result.uploads.map((upload) => upload.path)).toEqual([
      `${PROJECT}/${result.updateId}/01-tela-inicial-1.png`,
      `${PROJECT}/${result.updateId}/02-fluxo-de-agendamento.mov`,
    ]);
  });
});

describe("publishUpdate", () => {
  it("publishes the update and its media in one call", async () => {
    rpc.mockResolvedValue({ data: {}, error: null });
    const result = await publishUpdate({
      id: UPDATE,
      projectId: PROJECT,
      stageId: "",
      kind: "print",
      title: "Telas",
      body: "",
      media: [
        { path: `${PROJECT}/${UPDATE}/01-a.png`, mimeType: "image/png", width: 640, height: 480 },
      ],
    });
    expect(result).toEqual({ ok: true, message: "Atualização publicada." });
    // the client may get the news by e-mail (sendProjectDigest applies the 2-hour rule)
    expect(sendProjectDigest).toHaveBeenCalledWith({
      projectId: PROJECT,
      origin: "https://sdglabs.test",
    });
    expect(rpc).toHaveBeenCalledWith("publish_project_update", {
      p_id: UPDATE,
      p_project_id: PROJECT,
      p_stage_id: null,
      p_kind: "print",
      p_title: "Telas",
      p_body: "",
      p_media: [
        { path: `${PROJECT}/${UPDATE}/01-a.png`, mime_type: "image/png", width: 640, height: 480 },
      ],
    });
  });
});

describe("advanceStage", () => {
  it("names the stage that starts, or says the project is done", async () => {
    rpc.mockResolvedValueOnce({ data: { position: 2, title: "Design" }, error: null });
    expect(await advanceStage({ projectId: PROJECT })).toEqual({
      ok: true,
      message: "Etapa atual: Design.",
    });
    expect(notifyStageCompleted).toHaveBeenLastCalledWith({
      projectId: PROJECT,
      next: { position: 2, title: "Design" },
      origin: "https://sdglabs.test",
    });
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await advanceStage({ projectId: PROJECT })).toEqual({
      ok: true,
      message: "Última etapa concluída. Projeto concluído.",
    });
    expect(notifyStageCompleted).toHaveBeenLastCalledWith(expect.objectContaining({ next: null }));
  });
});

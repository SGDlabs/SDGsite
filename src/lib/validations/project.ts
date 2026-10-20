import { z } from "zod";

const uuid = z.uuid();
const projectName = z
  .string()
  .trim()
  .min(1, "Escreva o nome do projeto.")
  .max(160, "Use até 160 caracteres.");
const dateInput = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use uma data válida.")
  .optional();

export const PROJECT_TYPES = ["site", "app", "sistema"] as const;
export const UPDATE_KINDS = ["nota", "print", "video", "deploy", "marco"] as const;

/** Admin: a new project, created with the 5-stage template. */
export const newProjectSchema = z.object({
  clientId: uuid.or(z.literal("")).refine(Boolean, "Escolha o cliente."),
  name: projectName,
  type: z.enum(PROJECT_TYPES, "Escolha o tipo."),
  dueAt: dateInput,
});

export const projectDetailsSchema = z.object({
  id: uuid,
  name: projectName,
  startedAt: dateInput,
  dueAt: dateInput,
});

export const projectStatusSchema = z.object({
  id: uuid,
  status: z.enum(["ativo", "pausado", "concluido"]),
});

export const stageSchema = z.object({
  id: uuid,
  projectId: uuid,
  title: z.string().trim().min(1, "Escreva o nome da etapa.").max(80, "Use até 80 caracteres."),
  description: z.string().trim().max(500, "Use até 500 caracteres.").optional(),
});

/** What the bucket accepts (see the migration) and the largest file. */
export const MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
export const MAX_MEDIA_FILES = 12;

export const uploadRequestSchema = z.object({
  projectId: uuid,
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        type: z.enum(
          MEDIA_TYPES,
          "Envie imagens (PNG, JPG, WebP, GIF, AVIF) ou vídeos (MP4, WebM, MOV).",
        ),
        size: z.number().int().positive().max(MAX_MEDIA_BYTES, "Cada arquivo pode ter até 50 MB."),
      }),
    )
    .max(MAX_MEDIA_FILES, `Envie até ${MAX_MEDIA_FILES} arquivos por atualização.`),
});

/** The composer's fields; the files travel separately (uploaded straight to Storage). */
export const updateFormSchema = z.object({
  title: z.string().trim().min(1, "Escreva um título.").max(200, "Use até 200 caracteres."),
  body: z.string().trim().max(4000, "Use até 4000 caracteres.").optional(),
  kind: z.enum(UPDATE_KINDS),
  stageId: uuid.or(z.literal("")),
});

export const publishUpdateSchema = updateFormSchema.extend({
  id: uuid,
  projectId: uuid,
  media: z
    .array(
      z.object({
        path: z.string().min(1).max(400),
        mimeType: z.enum(MEDIA_TYPES),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      }),
    )
    .max(MAX_MEDIA_FILES),
});

export type NewProjectInput = z.input<typeof newProjectSchema>;
export type ProjectDetailsInput = z.input<typeof projectDetailsSchema>;
export type StageInput = z.input<typeof stageSchema>;
export type UploadRequest = z.input<typeof uploadRequestSchema>;
export type UpdateFormInput = z.input<typeof updateFormSchema>;
export type PublishUpdateInput = z.input<typeof publishUpdateSchema>;

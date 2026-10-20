import { z } from "zod";

// Empty values (a .env.local copied from .env.example) count as unset.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const publicSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: optional(z.url()),
    NEXT_PUBLIC_SUPABASE_URL: optional(z.url()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: optional(z.string().min(1)),
  })
  .refine(
    (env) => Boolean(env.NEXT_PUBLIC_SUPABASE_URL) === Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { message: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY go together" },
  );

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optional(z.string().min(1)),
  RESEND_API_KEY: optional(z.string().min(1)),
  EMAIL_FROM: optional(z.string().min(1)),
  /** where the partners get internal notices (a new lead) */
  EMAIL_TEAM: optional(z.string().min(1)),
  /** Vercel Cron sends it as "Authorization: Bearer …" to /api/cron/* */
  CRON_SECRET: optional(z.string().min(16)),
});

function parse<T extends z.ZodType>(
  schema: T,
  values: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables (see .env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/**
 * Variables that are safe in the browser, validated when this module first loads.
 * Next inlines NEXT_PUBLIC_* at build time only when each one is read by its full name.
 */
export const publicEnv = parse(publicSchema, {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * The Supabase project, or null when it is not configured. Without it the site runs on
 * src/content and only logs contact leads, which is enough for front-end work; production
 * always needs it.
 */
export const supabaseConfig =
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? { url: publicEnv.NEXT_PUBLIC_SUPABASE_URL, anonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY }
    : null;

if (!supabaseConfig && process.env.VERCEL_ENV === "production") {
  throw new Error("Supabase must be configured in production (see .env.example).");
}

export function requireSupabase() {
  if (!supabaseConfig) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }
  return supabaseConfig;
}

let serverEnvCache: z.infer<typeof serverSchema> | undefined;

/** Secrets for server code only: Server Components, Server Actions and Route Handlers. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser; secrets are server-only.");
  }
  serverEnvCache ??= parse(serverSchema, process.env);
  return serverEnvCache;
}

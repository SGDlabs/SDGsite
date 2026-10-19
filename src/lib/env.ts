import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
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

let serverEnvCache: z.infer<typeof serverSchema> | undefined;

/** Secrets for server code only: Server Components, Server Actions and Route Handlers. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser; secrets are server-only.");
  }
  serverEnvCache ??= parse(serverSchema, process.env);
  return serverEnvCache;
}

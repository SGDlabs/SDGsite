import { supabaseConfig } from "@/lib/env";

/** A path in the public "portfolio" bucket as a URL; site paths ("/portfolio/...") stay as they are. */
export function portfolioImageUrl(path: string) {
  if (path.startsWith("/") || /^https?:\/\//.test(path) || !supabaseConfig) return path;
  return `${supabaseConfig.url}/storage/v1/object/public/portfolio/${path}`;
}

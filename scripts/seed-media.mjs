// Uploads sample prints to the local Supabase Storage and attaches them to the seeded "print"
// update, so the client area shows a gallery. Local development only: needs `pnpm supabase start`
// and the keys from `pnpm supabase status` in .env.local. Safe to run again.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // the variables may come from the shell instead
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(url)) {
  console.error(`Refusing to touch ${url}: this script is for the local Supabase only.`);
  process.exit(1);
}

const PROJECT = "22222222-2222-4222-8222-222222222222";
const UPDATE = "44444444-0000-4000-8000-000000000002";
const FILES = [
  { source: "public/portfolio/projeto-app/galeria-1.png", name: "tela-agenda.png" },
  { source: "public/portfolio/projeto-app/galeria-2.png", name: "tela-confirmacao.png" },
];

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error: cleanError } = await supabase.from("update_media").delete().eq("update_id", UPDATE);
if (cleanError) throw cleanError;

for (const file of FILES) {
  const path = `${PROJECT}/${UPDATE}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("project-media")
    .upload(path, readFileSync(join(process.cwd(), file.source)), {
      contentType: "image/png",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("update_media").insert({
    update_id: UPDATE,
    storage_path: path,
    mime_type: "image/png",
    width: 640,
    height: 480,
  });
  if (insertError) throw insertError;
  console.log(`attached ${path}`);
}

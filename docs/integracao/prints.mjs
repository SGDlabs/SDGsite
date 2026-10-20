// Copy to .github/sdg/prints.mjs in the CLIENT's repository, next to the workflow
// sdg-update.yml. Opens each page of the preview on a desktop and a phone, takes a print of what
// shows first, and posts them to the project's feed at SDG Labs.
//
// Env: SDG_TOKEN, SDG_API, PREVIEW_URL, PAGES ("/ /contato"), ENVIRONMENT, COMMIT_SHA.
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

const {
  SDG_TOKEN,
  SDG_API,
  PREVIEW_URL,
  PAGES = "/",
  ENVIRONMENT = "",
  COMMIT_SHA = "",
} = process.env;
for (const [name, value] of Object.entries({ SDG_TOKEN, SDG_API, PREVIEW_URL })) {
  if (!value) throw new Error(`${name} is not set`);
}

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false },
  { label: "celular", viewport: { width: 390, height: 844 }, isMobile: true },
];
// the API takes up to 4 MB of files per call: JPEG keeps a dozen prints well under it
const MAX_BYTES = 4 * 1024 * 1024;

const browser = await chromium.launch({ channel: "chrome" });
const form = new FormData();
let total = 0;
for (const path of PAGES.split(/\s+/).filter(Boolean)) {
  for (const device of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: device.viewport,
      isMobile: device.isMobile,
      deviceScaleFactor: device.isMobile ? 2 : 1,
    });
    const page = await context.newPage();
    await page.goto(new URL(path, PREVIEW_URL).href, { waitUntil: "networkidle" });
    const shot = await page.screenshot({ type: "jpeg", quality: 80 });
    await context.close();
    if (total + shot.length > MAX_BYTES) {
      console.warn(`skipping ${path} (${device.label}): over 4 MB in total`);
      continue;
    }
    total += shot.length;
    const name = `${path === "/" ? "inicio" : path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${device.label}.jpg`;
    form.append("files", new Blob([shot], { type: "image/jpeg" }), name);
  }
}
await browser.close();

const message = COMMIT_SHA
  ? execSync(`git log -1 --format=%s ${COMMIT_SHA}`, { encoding: "utf8" }).trim()
  : "";
form.append("kind", "deploy");
form.append(
  "title",
  `Deploy${ENVIRONMENT ? ` (${ENVIRONMENT})` : ""}: ${message || "nova versão"}`.slice(0, 200),
);
form.append(
  "body",
  [`Preview: ${PREVIEW_URL}`, COMMIT_SHA && `Commit: ${COMMIT_SHA.slice(0, 7)}`]
    .filter(Boolean)
    .join("\n"),
);

const response = await fetch(SDG_API, {
  method: "POST",
  headers: { Authorization: `Bearer ${SDG_TOKEN}` },
  body: form,
});
const answer = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`SDG Labs answered ${response.status}: ${answer.error?.message ?? "no details"}`);
}
console.log(`posted "${answer.title}" with ${answer.media} prints`);

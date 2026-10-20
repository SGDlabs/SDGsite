import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Supabase Auth parses these files as Go templates. When parsing fails it quietly falls back to
// its own English e-mail, whose link skips our pages, so check what it would trip on.

const TEMPLATES = {
  "invite.html": "/convite",
  "recovery.html": "/redefinir-senha",
};

describe.each(Object.entries(TEMPLATES))("%s", (file, page) => {
  const html = readFileSync(join(import.meta.dirname, "..", "templates", file), "utf8");

  it("links straight to its page with the token hash", () => {
    expect(html).toContain(`href="{{ .SiteURL }}${page}?token_hash={{ .TokenHash }}"`);
  });

  it("has no template braces inside HTML comments", () => {
    for (const comment of html.match(/<!--[\s\S]*?-->/g) ?? []) {
      expect(comment).not.toMatch(/\{\{|\}\}/);
    }
  });

  it("only uses fields Supabase provides", () => {
    const fields = [...html.matchAll(/\{\{\s*(?:if\s+)?(\.[\w.]+)/g)].map((match) => match[1]);
    for (const field of fields) {
      expect([".SiteURL", ".TokenHash", ".Data.full_name"]).toContain(field);
    }
  });
});

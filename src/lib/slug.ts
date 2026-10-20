/** "Tela Inicial (1)" → "tela-inicial-1": lowercase ASCII words joined by hyphens. */
export function slugify(text: string, max = 80) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** A file name Storage accepts and people can read: "Tela Inicial.PNG" → "tela-inicial.png". */
export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = slugify(dot > 0 ? name.slice(0, dot) : name, 60) || "arquivo";
  const extension =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "";
  return extension ? `${base}.${extension}` : base;
}

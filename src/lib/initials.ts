/** Up to two initials from a name ("Maria Souza" → "MS") or an e-mail ("ana@x.com" → "A"). */
export function initials(name: string) {
  const words = (name.split("@")[0] ?? "").split(/[\s._-]+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

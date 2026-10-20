// Dates as the client reads them: Brazilian Portuguese, São Paulo time. Formatted on the server
// (queries), so the browser shows the same text it hydrates.

const TIME_ZONE = "America/Sao_Paulo";

const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/** "18 de out. de 2026" */
export function formatDay(iso: string) {
  return dayFormat.format(new Date(iso));
}

/** "18 de out. de 2026, 14:30" */
export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

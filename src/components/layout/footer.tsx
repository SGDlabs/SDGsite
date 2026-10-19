import { site } from "@/lib/site";
import { Container } from "./container";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-surface-inverse text-ink-inverse [--focus:var(--ink-inverse)]">
      {/* decorative divider: the final CTA and the footer share the same inverse band */}
      <Container className="flex flex-wrap items-end justify-between gap-6 border-t border-ink-muted py-12">
        <div className="flex flex-col gap-2">
          <Logo variant="horizontal" inverse />
          <p className="type-small">{site.slogan}</p>
        </div>
        <p className="type-small">
          <a href={`mailto:${site.contactEmail}`} className="text-ink-inverse underline">
            {site.contactEmail}
          </a>
          <span aria-hidden="true"> · </span>
          <span>© {site.name}</span>
        </p>
      </Container>
    </footer>
  );
}

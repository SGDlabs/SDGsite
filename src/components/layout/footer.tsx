import { site } from "@/lib/site";
import { Container } from "./container";
import { Logo } from "./logo";

/** Footer of the logged-in and internal areas: logo, slogan and signature on surface-inverse. */
export function Footer() {
  return (
    <footer className="bg-surface-inverse text-ink-inverse [--focus:var(--ink-inverse)]">
      <Container className="flex flex-wrap items-end justify-between gap-6 py-12">
        <div className="flex flex-col gap-2">
          <Logo variant="horizontal" inverse />
          <p className="type-small">{site.slogan}</p>
        </div>
        <p className="type-small">© {site.name}</p>
      </Container>
    </footer>
  );
}

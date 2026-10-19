import Link from "next/link";
import { Logo } from "./logo";

/** Placeholder for routes that exist in the structure but are built in a later phase. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="flex max-w-120 flex-col items-center gap-4 text-center">
        <Logo variant="icon" />
        <h1 className="type-h1">{title}</h1>
        <p className="text-ink-muted">{text}</p>
        <Link href="/" className="type-label underline">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}

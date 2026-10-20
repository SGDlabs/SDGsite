import { Fragment } from "react";

const STACK = [
  "Next.js",
  "React",
  "React Native",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Supabase",
  "Tailwind CSS",
  "Figma",
  "Vercel",
];

export function Marquee() {
  return (
    <section className="marquee" aria-label="Tecnologias com que trabalhamos">
      <div className="mq">
        <div className="mq-track">
          {/* the list runs twice so the loop is seamless; the copy is hidden from screen readers */}
          {[false, true].map((copy) =>
            STACK.map((name) => (
              <Fragment key={`${copy}-${name}`}>
                <span aria-hidden={copy || undefined}>{name}</span>
                <i></i>
              </Fragment>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

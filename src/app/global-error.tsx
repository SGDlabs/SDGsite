"use client";

import { useEffect } from "react";
import { ErrorStatus } from "@/components/layout/status-page";
import "./globals.css";

/**
 * The root layout itself broke: this replaces it, so it brings its own <html>, <body> and styles.
 * The fonts fall back to the system ones (the root layout loads them).
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <title>Algo deu errado · SDG Labs</title>
        <ErrorStatus retry={retry} />
      </body>
    </html>
  );
}

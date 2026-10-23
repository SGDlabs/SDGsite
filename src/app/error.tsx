"use client";

import { useEffect } from "react";
import { ErrorStatus } from "@/components/layout/status-page";

/** Something broke on a page that has no error page of its own (the client area has one). */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Algo deu errado · SDG Labs</title>
      <ErrorStatus retry={retry} />
    </>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { LINK_ERRORS, type LinkError } from "@/lib/auth/messages";

/** The reason an e-mail link failed (?erro= from /auth/callback). Render inside <Suspense>. */
export function LinkErrorNotice() {
  const code = useSearchParams().get("erro");
  if (!code || !(code in LINK_ERRORS)) return null;
  return <Notice tone="alert">{LINK_ERRORS[code as LinkError]}</Notice>;
}

import type { ReactNode } from "react";
import { CenteredPage } from "@/components/layout/centered-page";

/** Sign-in pages: the logo back to the site and one card in the middle of the screen. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <CenteredPage>{children}</CenteredPage>;
}

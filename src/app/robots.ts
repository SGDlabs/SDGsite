import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Search engines read the public site; the client area, the admin and internal pages stay out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/painel",
        "/admin",
        "/design",
        "/api",
        "/auth",
        "/login",
        "/convite",
        "/recuperar-senha",
        "/redefinir-senha",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}

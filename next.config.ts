import type { NextConfig } from "next";

// Portfolio images uploaded in the admin panel are served from Supabase Storage's public bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

// Sent with every response. The CSP leaves scripts and styles alone (Next's inline scripts would
// need a nonce, which makes every page dynamic); it closes framing, plugins, <base> and form
// targets, which nothing here uses.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // browsers only honor it over HTTPS; no includeSubDomains, so subdomains keep their own rules
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  partialPrefetching: true,
  images: {
    // Next 16 refuses to optimize images from local addresses (SSRF). The local Supabase of
    // development and CI is one; the patterns below still allow only its public bucket.
    dangerouslyAllowLocalIP: ["127.0.0.1", "localhost"].includes(supabaseUrl?.hostname ?? ""),
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// Portfolio images uploaded in the admin panel are served from Supabase Storage's public bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
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

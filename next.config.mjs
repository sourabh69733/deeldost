/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Files read at runtime with fs must be listed so they ship with the deployed server.
    outputFileTracingIncludes: {
      "/api/rate-card": ["./src/assets/fonts/**"],
    },
  },
};

export default nextConfig;

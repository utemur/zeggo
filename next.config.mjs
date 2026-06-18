/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint runs separately in CI; skip during `next build` to avoid
    // false failures from plugin-load timeouts in restricted environments.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

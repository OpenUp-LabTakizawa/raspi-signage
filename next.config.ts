import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    viewTransition: true,
  },
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig

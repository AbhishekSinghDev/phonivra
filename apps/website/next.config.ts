import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ['@phonivra/ui']
}

export default nextConfig

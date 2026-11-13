import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ['@phonivra/ui']
}

export default createMDX({ macro: false })(nextConfig)

import Image from 'next/image'
import type { ReactNode } from 'react'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { DocsPageIcon } from '@/components/docs-page-icon'
import { GitHubIcon } from '@/components/github-icon'
import { siteLinks } from '@/components/site-links'
import { docsSource } from '@/lib/docs-source'

export default function DocumentationLayout({ children }: { children: ReactNode }) {
  const tree = docsSource.getPageTree()

  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout
        tree={{
          ...tree,
          children: tree.children.map((node) =>
            node.type === 'page' ? { ...node, icon: <DocsPageIcon url={node.url} /> } : node
          )
        }}
        nav={{
          title: (
            <span className="flex items-center gap-2 font-onest text-lg font-semibold">
              <Image
                src="/images/phonivra-dark.png"
                width={28}
                height={28}
                alt=""
                className="rounded-md"
              />
              Phonivra Docs
            </span>
          ),
          url: '/docs'
        }}
        links={[
          { text: 'Home', url: '/' },
          {
            type: 'icon',
            text: 'View source',
            label: 'View source',
            url: siteLinks.repository,
            external: true,
            icon: (
              <span className="flex items-center gap-2 whitespace-nowrap">
                <GitHubIcon />
                <span>View source</span>
              </span>
            )
          }
        ]}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  )
}

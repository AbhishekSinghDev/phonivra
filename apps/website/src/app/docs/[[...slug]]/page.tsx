import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { docsSource } from '@/lib/docs-source'

type DocsPageProps = PageProps<'/docs/[[...slug]]'>

async function getPage(params: DocsPageProps['params']) {
  const { slug } = await params
  return docsSource.getPage(slug) ?? notFound()
}

export default async function DocumentationPage({ params }: DocsPageProps) {
  const page = await getPage(params)
  const Content = page.data.body
  const isLanding = page.slugs.length === 0

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'block' }}
      tableOfContentPopover={{ enabled: isLanding ? false : undefined, style: 'block' }}
      breadcrumb={{ enabled: !isLanding }}
      footer={{ enabled: !isLanding }}
    >
      <DocsTitle className={isLanding ? 'mb-3 text-4xl tracking-tight sm:text-5xl' : undefined}>
        {page.data.title}
      </DocsTitle>
      {!isLanding && <DocsDescription>{page.data.description}</DocsDescription>}
      <DocsBody>
        <Content components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return docsSource.generateParams()
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const page = await getPage(params)
  const title = page.slugs.length ? `${page.data.title} | Phonivra Docs` : page.data.title
  const { description } = page.data

  return {
    title,
    description,
    openGraph: { type: 'website', locale: 'en_US', siteName: 'Phonivra', title, description },
    twitter: { card: 'summary', title, description }
  }
}

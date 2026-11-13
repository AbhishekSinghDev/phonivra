const paths: Record<string, string> = {
  '/docs': 'm3 10 9-7 9 7v10H3z M9 20v-6h6v6',
  '/docs/install': 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  '/docs/first-narration': 'M8 4l12 8-12 8z',
  '/docs/scripts': 'M6 3h8l4 4v14H6z M14 3v5h4M9 12h6m-6 4h6',
  '/docs/voices': 'M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z M5 11v1a7 7 0 0 0 14 0v-1M12 19v3',
  '/docs/models': 'm12 3 9 5-9 5-9-5z M3 12l9 5 9-5M3 16l9 5 9-5',
  '/docs/batch': 'M8 3h12v14H8z M4 7v14h12M11 7h6m-6 4h6',
  '/docs/audio': 'M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4',
  '/docs/storage': 'M4 5h16v14H4z M4 14h16m-4 2h1',
  '/docs/troubleshooting':
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01',
  '/docs/publishing': 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6'
}

export function DocsPageIcon({ url }: { url: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d={paths[url] ?? paths['/docs/scripts']} />
    </svg>
  )
}

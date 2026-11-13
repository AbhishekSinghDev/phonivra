# Phonivra Website

This app owns the public marketing site and documentation. Verify feature claims against the current desktop and engine implementation. Verify installer URLs, release availability, platform support, and licensing before publishing claims.

## Boundaries

- Keep [page.tsx](src/app/page.tsx) as section composition inside `SiteShell`. Place section markup in focused components and external URLs in [site-links.ts](src/components/site-links.ts).
- Keep Electron APIs, desktop stores, and IPC types outside the site. Preserve `transpilePackages` for `@phonivra/ui` and `agentRules: false` so Next.js does not generate competing instructions.
- Import the shared stylesheet and scan website sources in [globals.css](src/app/globals.css). Preserve the class-based theme adapter and local fonts. Keep supplied screenshots intact and handle framing in CSS. Refresh both theme captures when replacing desktop screenshots.

- Write documentation in [content/docs](content/docs) and order pages in its `meta.json`. Fumadocs generates `.source` during development, build, and typecheck. Verify documentation against the desktop app and engine.

## Run and verify

```sh
pnpm dev:website
pnpm --filter @phonivra/website typecheck
pnpm --filter @phonivra/website lint
pnpm --filter @phonivra/website build
```

Use the typecheck script so Next.js generates route types. Reuse the checkout's running dev server when available because another instance can contend for the same Next.js dev lock. For visual changes, check mobile and desktop widths and both themes. For interaction changes, check keyboard navigation and reduced motion where applicable.

# Website

## Product truth

This is a marketing site, not a browser version of the desktop studio.
`../../docs/FEATURES.md` is the source of truth for product claims, especially
its opening caveat and incomplete/not-user-facing sections. Use `../../README.md`
for site composition, asset provenance and release placeholders.

- Identify engine-dependent generation, playback, import/export and downloads as
  simulated or planned. An implemented interface does not establish working audio IO.
- Do not invent installer links, release dates, platform requirements, app/model
  licensing, partnerships or a production canonical domain. Availability stays
  explicit until those details are verified.
- Keep supplied screenshots unchanged; framing/cropping belongs in CSS. Refresh
  both theme captures when updating desktop imagery. Decorative desktop/Dock
  controls are illustrations, not working app controls.

## Integration

- Keep `src/app/page.tsx` as section composition inside `SiteShell`; section markup
  belongs in focused components. `src/components/site-links.ts` owns external URLs.
  Use Next.js `Link` for navigation, including anchors; new-tab links keep
  `noopener noreferrer`.
- `@/` resolves to `src/`. Keep Electron APIs, desktop stores and desktop IPC types
  out of this app; share presentation through the UI package's public exports.
- Preserve `transpilePackages: ['@phonivra/ui']`: the package exports source, not
  compiled JS. `agentRules: false` prevents Next.js from generating competing instructions.
- `src/app/globals.css` imports shared CSS and explicitly scans app source. Keep
  site-only layout/capture rules here and shared appearance in the UI stylesheet.
  `SystemTheme` owns the `next-themes` adapter; retain class-based dark mode and
  hydration handling. Font loading stays local, including the shared Manrope preload.

## Run and verify

From the repo root:

```sh
pnpm dev:website
pnpm --filter @phonivra/website typecheck
pnpm --filter @phonivra/website lint
pnpm --filter @phonivra/website build
```

Development binds to 127.0.0.1 (port 3000 by default). Reuse an existing dev server
for this checkout; a second instance can fail on `.next/dev`'s lock even on another
port. The typecheck script generates route types before TypeScript; do not replace
it with bare `tsc`. Verify changed sections at mobile and desktop widths, both
themes, keyboard navigation and reduced motion. Turbopack builds also need local
worker ports; if a sandbox reports `binding to a port: Operation not permitted`,
retry with permitted access and report any remaining failure. Do not change build
configuration to bypass the restriction. Compilation does not validate product claims.

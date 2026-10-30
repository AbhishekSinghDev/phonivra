# Shared UI

This package owns shared shadcn/audiocn components, browser audio helpers/hooks,
`cn`, locally bundled fonts and theme/component styling. It exports TypeScript
source directly; there is no build task or separate watcher. Both apps compile it.

## Maintenance boundaries

- Keep this package browser-safe and app-independent: no Node/Electron imports,
  `window.api`, app stores or imports from either app. Theme values and callbacks
  come from consumers through props; do not add an app-specific theme provider.
- Preserve client boundaries on shared components so Next.js server pages can
  import them. Guard browser APIs from execution during server rendering.
- Both Radix and Base UI primitives exist here. Check the component's actual
  imports/API before choosing `asChild` versus `render`; do not migrate its
  underlying primitive library as a styling change.
- Use the root component-add workflow and inspect diffs before replacing existing
  components; preserve local styling and behavior. Package exports already cover
  new components and `.ts` helpers/hooks. A new `.tsx` hook needs an explicit export
  like the two existing audio-provider hooks.
- Consumers use public `@phonivra/ui/...` subpaths, not relative source paths.
  Prefer existing variants; shared appearance changes belong here rather than
  per-app overrides or copies. Lint exceptions for component internals do not
  extend to consumers or to this package's hooks/helpers.

## CSS ownership

`src/styles/globals.css` contains Tailwind v4 imports with `source(none)`, local
font imports, explicit UI source scanning, `@theme inline` mappings, light/dark
tokens, base rules, utilities and slot/studio selectors. Keep theme values in both
token sets; preserve reduced-motion and focus rules. Each consumer must import
`@phonivra/ui/globals.css` and scan its own source explicitly: the shared scan does
not discover app classes. App-only document/layout behavior stays in app CSS.

## Verify

From the repo root:

```sh
pnpm --filter @phonivra/ui typecheck
pnpm --filter @phonivra/ui lint
```

These checks cover package source only; follow the root verification instructions
for both consuming apps after changing shared exports, components or CSS.

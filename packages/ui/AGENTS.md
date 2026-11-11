# Phonivra Shared UI

This package exports browser-safe TypeScript source and shared CSS. Desktop and website compile it directly.

## Boundaries

- Keep components and hooks independent of either app. Keep Node, Electron, `window.api`, and app stores outside this package. Preserve client boundaries and guard browser-only APIs during server rendering.
- Check the primitive's actual import before using Radix `asChild` or Base UI `render`. For registry changes, follow the [component workflow](../../README.md#shared-ui-and-adding-components) and review the generated diff for local behavior and styling.
- Keep public subpaths aligned with [package exports](package.json). The existing hook wildcard targets `.ts` files. Add an explicit export for a new public `.tsx` hook.
- Keep shared light and dark tokens, local fonts, focus styles, and reduced-motion rules in [globals.css](src/styles/globals.css). Each app scans its own sources in its stylesheet because the shared scan only covers UI source.

## Verify

```sh
pnpm --filter @phonivra/ui typecheck
pnpm --filter @phonivra/ui lint
```

For changes to shared exports, components, or CSS, verify affected behavior in both [desktop](../../apps/desktop/AGENTS.md) and [website](../../apps/website/AGENTS.md).

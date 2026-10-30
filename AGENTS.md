# Phonivra

Local text-to-speech studio: `apps/desktop` (`phonivra`, Electron),
`apps/website` (`@phonivra/website`, Next.js marketing), and `packages/ui`
(`@phonivra/ui`, shared UI source). Read the nested `AGENTS.md` before editing
any workspace, including when starting an agent at the root.

## Commands

Use Node **>=24.22.0 <25** and **pnpm 12.15.0** (pinned in `packageManager`);
`.nvmrc` selects only the major version. Run commands below from the repo root.

| Command                          | Scope                                                  |
| -------------------------------- | ------------------------------------------------------ |
| `pnpm install --frozen-lockfile` | Install the existing lockfile across the workspace     |
| `pnpm typecheck`                 | All workspaces; includes Next.js route type generation |
| `pnpm lint`                      | All workspaces; warnings fail                          |
| `pnpm format:check`              | Entire repo, including documentation                   |
| `pnpm build`                     | Both apps and prerequisite shared UI checks            |

Single-workspace commands are in the nested files. There is no automated test
runner or test script. Before finishing code changes, run the relevant checks
above and exercise the changed flows; check both themes for UI changes. Shared
UI changes require checking both consumers. Report blocked checks rather than
treating cached output as fresh verification. See `README.md` → Development for
formatting writes, dependency updates and task caching; do not hand-edit the lockfile
or generated output.

## Shared boundaries

- Both apps use `@phonivra/ui/components/*`, `@phonivra/ui/hooks/*`,
  `@phonivra/ui/lib/*` and `@phonivra/ui/globals.css`; do not create app-local
  copies of shared primitives or theme tokens. App-specific composites stay in apps.
- Keep Electron/IPC contracts and app stores out of the shared UI package.
  Its dependencies belong in `packages/ui`; app/framework dependencies stay in apps.
- Preview additions from the root with
  `pnpm ui:add @shadcn/aspect-ratio --dry-run` (substitute the desired component).
  Review before applying; the complete add/update workflow is in
  `README.md` → Shared UI and adding components. Use the CLI, not lookalikes.
- Use semantic tokens and existing variants. Consumer styling is constrained by
  `.oxlintrc.json`'s shadcn rules; do not relax lint rules to bypass a styling error.
- For current library/tool APIs, use Context7 when available: resolve the library
  ID first, then query the specific question; otherwise consult official docs.

## Targeted references

Read skills only when relevant: `.agents/skills/shadcn/SKILL.md` for component
work; `.agents/skills/impeccable/SKILL.md` for UI design;
`.agents/skills/chaiui/SKILL.md` and `.agents/skills/chaiui-review/SKILL.md`
for ChaiUI work. Preserve the existing shared theme rather than reinstalling a
registry theme. Product behavior and app-specific documentation pointers live in
the nested instructions.

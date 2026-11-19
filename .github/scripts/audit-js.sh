#!/usr/bin/env bash
set -euo pipefail

report=$(mktemp)
trap 'rm -f "$report"' EXIT
status=0
pnpm audit --audit-level high --json > "$report" || status=$?
cat "$report"
if [[ "$status" == 0 ]]; then exit 0; fi

# The advisory has no published fix. The affected desktop paths are tooling,
# and the website's configured content globs do not take patterns from users.
# Owner: Phonivra maintainers. Review upstream before extending this exception.
if [[ "$status" != 1 || ! $(date -u +%F) < 2026-12-18 ]]; then exit "$status"; fi
node - "$report" <<'JS'
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const advisories = Object.values(report.advisories ?? {})
if (report.error || report.metadata?.vulnerabilities?.critical !== 0 ||
    report.metadata?.vulnerabilities?.high !== 1 || advisories.length !== 1 ||
    advisories[0].github_advisory_id !== 'GHSA-fc5q-39xc-vjpf' ||
    advisories[0].severity !== 'high' || advisories[0].patched_versions !== null) {
  process.exit(1)
}
console.log('Temporarily excepting GHSA-fc5q-39xc-vjpf until 2026-12-18 UTC.')
JS

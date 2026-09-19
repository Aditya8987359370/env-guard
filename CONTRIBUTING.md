# Contributing to EnvGuard

Thank you for helping protect developers without sending their code anywhere.

## Setup

Install Node.js 20.11+ and Git, then run `npm install`. Use `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before opening a pull request.

## Adding a detector

Put focused known-pattern rules in `src/detectors/patterns.ts`, generic assignment logic in `src/detectors/generic.ts`, and statistical logic in `src/detectors/entropy.ts`. Give every rule a stable ID, clear "Possible" wording where validity is uncertain, a justified severity estimate, and tests for positive and negative matches.

Fixtures and tests must use invented, non-working values only. Never commit a credential, customer source code, or unredacted scanner output. Add a masking regression test whenever a new output path is introduced.

## Pull requests

Keep changes focused, explain security effects, and include tests. Do not weaken local/offline defaults or add telemetry. For a security-sensitive change, avoid publishing exploit details before maintainers have assessed it; use the private reporting route in SECURITY.md.

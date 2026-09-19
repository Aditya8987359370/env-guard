# Contributing to EnvGuard

Thank you for helping make secret protection useful without sending developers' code anywhere.

## Before you start

Install Node.js 20.11 or newer and Git. Fork the repository on GitHub, clone your fork, then run:

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Create a focused branch for your work and open a pull request against `main`. The CI workflow must pass before a change is merged.

## Adding a detector or rule

- Put known token patterns in `src/detectors/patterns.ts`.
- Put broad assignment detection in `src/detectors/generic.ts`.
- Put statistical detection in `src/detectors/entropy.ts`.
- Give each rule a stable ID, clear description, category, and severity estimate.
- Use "Possible" wording unless a match alone proves the fact being reported.
- Add positive, negative, false-positive, and masking tests in `tests/`.

All fixtures must be invented, non-working values. Never commit real credentials, customer source code, or unredacted scanner output. Every new output path must have a test proving raw values do not leak.

## Pull request checklist

- Explain the user-visible behavior and security impact.
- Keep the change focused and update documentation when behavior changes.
- Run typecheck, lint, tests, and build locally.
- Preserve local-first defaults: no telemetry, source upload, or required external API.

For a suspected vulnerability, do not open a public issue. Follow [SECURITY.md](SECURITY.md) instead.

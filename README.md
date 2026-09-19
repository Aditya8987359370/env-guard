# EnvGuard

**Protect your secrets before they reach Git.**

EnvGuard is a local-first, offline TypeScript CLI that looks for possible credentials in source files, configuration, environment files, staged Git content, and Git history. It never needs an account, API key, server, database, telemetry, or network request to scan.

> Detection is an estimate. A match does not prove that a credential is valid. EnvGuard always masks values in terminal, JSON, and SARIF output.

## Install

Requires Node.js 20.11 or newer and Git for Git features.

```sh
npm install
npm run build
npx envguard scan
```

For a published package, use `npm install -g envguard` and then run `envguard scan`.

## Quick start

```sh
envguard init                 # creates only missing safe starter files
envguard scan .               # scan this project
envguard scan --json          # machine-readable, redacted output
envguard scan --sarif         # SARIF 2.1.0 for security tools
envguard install-hook         # protect future Git commits
envguard history --all        # scan reachable Git history
envguard rules                # list built-in rules
envguard fix                  # safe remediation guidance
```

Exit codes: `0` means no findings, `1` means possible secrets were found, and `2` means a configuration or runtime error.

## What it detects

Built-in modular rules cover possible AWS access keys, GitHub tokens, Google API keys, Stripe keys, Slack tokens, JWTs, private-key headers, bearer tokens, generic assignments such as `API_KEY=`, and high-entropy strings with contextual signals. Rules are intentionally cautious and placeholders such as `YOUR_API_KEY`, `sk-example`, `example-secret`, and `test-token` are ignored.

EnvGuard skips `.git`, `node_modules`, build and cache folders, binary files, oversize files, and symlinks by default. It also reads `.gitignore`. One unreadable file does not abort the scan.

## Git protection

`envguard install-hook` creates `.git/hooks/pre-commit`. It scans only staged content and blocks a commit when it finds a possible secret. If an existing custom hook is present, it is saved as `pre-commit.envguard-backup` before EnvGuard installs its hook. Review and merge that backup if the old hook contained required project logic.

`envguard history --since <commit>` scans commits after a revision. `--path <file>` limits it to a file. Rotate/revoke any exposed credential, remove it from current source, and clean history only after carefully reviewing Git's history-rewrite guidance. EnvGuard never revokes credentials or rewrites history.

## Configuration

Configuration is optional. `envguard init` creates this starting point only when absent:

```yaml
scan:
  paths: [.] 
ignore:
  - "**/*.test.ts"
rules:
  disabled: []
  entropy:
    enabled: true
    threshold: 4.0
output:
  maskSecrets: true
```

Add a built-in rule ID from `envguard rules` to `rules.disabled` to turn it off. Lower entropy thresholds find more candidates and may increase false positives. The maximum scanned file size defaults to 1 MiB and can be changed with `scan.maxFileSize`.

## GitHub Actions and SARIF

This repository includes `.github/workflows/envguard.yml`. Copy it into your project, then change the setup step to install EnvGuard from npm once published. The workflow generates SARIF and uploads it to GitHub Code Scanning. SARIF never contains the full detected value.

## Privacy and security model

Normal scans run entirely on your machine: no telemetry, analytics, uploads, external APIs, or AI integration. The core engine is deterministic and works offline. It validates paths through Node APIs, avoids shell interpolation for Git operations, skips symlinks and binary data, caps file size, and centralizes redaction.

No scanner catches every secret or can judge validity. Treat results as prompts to investigate. Do not paste real credentials into issues, logs, CI output, or tests.

## Development

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
node dist/index.js --help
node dist/index.js scan --json
node dist/index.js scan --sarif
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the MIT [LICENSE](LICENSE).

## Roadmap

Future extensions may add custom rule packages, editor integrations, optional AI explanations, and provider-specific rotation guidance. Core scanning will remain local-first and API-key-free.

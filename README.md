# EnvGuard

[![CI](https://github.com/Aditya8987359370/env-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/Aditya8987359370/env-guard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 20.11+](https://img.shields.io/badge/node-%3E%3D20.11.0-339933)](https://nodejs.org/)

**Protect your secrets before they reach Git.**

EnvGuard is a free, open-source command-line tool that helps developers find possible passwords, API keys, tokens, private keys, and connection strings before they are committed to Git. It runs on your own computer, works offline, and does not send your source code or findings to any server.

> A finding is a signal to investigate, not proof that a credential works. EnvGuard masks detected values in terminal, JSON, SARIF, Git-hook, and error output.

## What you can do with EnvGuard

- Scan a project, folder, or file for possible secrets.
- Prevent a commit when staged content contains a possible secret.
- Check Git history for credentials that may already have been committed.
- Use JSON in scripts and SARIF in GitHub Code Scanning.
- Tune ignores, disabled rules, file-size limits, and entropy sensitivity.
- Inspect skipped files and non-fatal read warnings with `--verbose`.
- Work without accounts, telemetry, external APIs, databases, or AI keys.

## Install and run

You need [Node.js](https://nodejs.org/) 20.11 or newer. Git is required only for the commit-hook and history commands.

### Use this repository locally

```sh
git clone https://github.com/Aditya8987359370/env-guard.git
cd env-guard
npm install
npm run build
npm exec envguard -- scan .
```

### Install globally after publishing to npm

```sh
npm install --global envguard
envguard scan .
```

## Quick start

Run these commands inside the project you want to protect:

```sh
envguard init                 # Creates only missing safe starter files
envguard scan .               # Scans the current project
envguard scan --json          # Prints redacted, machine-readable JSON
envguard scan --sarif         # Prints redacted SARIF 2.1.0
envguard scan --verbose       # Shows skipped-file and read-warning details
envguard install-hook         # Installs local pre-commit protection
envguard uninstall-hook       # Restores the previous hook, when one was saved
envguard history --all        # Scans reachable Git history
envguard rules                # Lists built-in rules and severities
envguard fix                  # Shows safe remediation guidance
```

Exit code `0` means no findings, `1` means possible secrets were found, and `2` means EnvGuard could not complete because of a configuration or runtime error.

## Example output

```text
EnvGuard found 1 possible secret(s).
src/config.ts:18
  Possible GitHub Token [CRITICAL]
  Value: ghp_************90

Rotate or revoke exposed credentials, remove them from source, and prevent future commits.
```

The original value is never shown. Do not paste real secrets into issues, terminal screenshots, CI logs, or tests.

## Detection coverage

EnvGuard uses three independent layers:

1. **Known patterns** for possible AWS access keys, GitHub, GitLab, npm, Google, Stripe, and Slack tokens, JWTs, private-key headers, bearer tokens, and database connection strings.
2. **Generic credential assignments** such as `API_KEY=`, `PASSWORD=`, `DATABASE_URL=`, and `CLIENT_SECRET=` across common source and configuration formats.
3. **Entropy analysis** for unusually random-looking values when context suggests a credential.

It skips placeholders such as `YOUR_API_KEY`, `sk-example`, `example-secret`, and `test-token`. It also respects `.gitignore` and `.envguard.yml`, skips binary files and symlinks, limits file size to 1 MiB by default, and ignores dependency/build folders.

## Protect Git commits

```sh
envguard install-hook
```

The hook scans only staged content before each commit. A clean commit is allowed; a finding blocks the commit with masked evidence. If a custom pre-commit hook already exists, EnvGuard saves it as `pre-commit.envguard-backup` and runs it first. `envguard uninstall-hook` restores that previous hook automatically.

## Scan Git history

```sh
envguard history --all
envguard history --since abc1234
envguard history --path src/config.ts
```

If history contains a real credential: rotate or revoke it first, remove it from current source, then decide whether history cleanup is needed. EnvGuard never revokes credentials and never rewrites Git history automatically.

## Configuration

Configuration is optional. `envguard init` creates `.envguard.yml` only when it does not already exist:

```yaml
scan:
  paths:
    - .
  maxFileSize: 1048576
ignore:
  - '**/*.test.ts'
  - 'package-lock.json'
rules:
  disabled: []
  entropy:
    enabled: true
    threshold: 4.0
output:
  maskSecrets: true
```

Add a rule ID from `envguard rules` to `rules.disabled` to turn that rule off. A lower entropy threshold reports more candidates and may increase false positives. Use `ignore` for generated files, test fixtures, and documentation examples that should not be scanned.

## JSON and SARIF

`envguard scan --json` returns a versioned object containing file counts, masked findings, rule IDs, severity estimates, paths, and line numbers. `envguard scan --sarif` produces SARIF 2.1.0 for security tooling. Both formats keep secret values redacted.

## GitHub Actions

This repository includes [an EnvGuard workflow](.github/workflows/envguard.yml). To protect another repository, copy that file, change the install command to `npm install --global envguard` after publishing, and keep the SARIF upload step if GitHub Code Scanning is enabled for your repository.

## Privacy and limitations

Normal scanning is local and deterministic: no telemetry, analytics, source upload, secret upload, external API, server, database, or AI key is required. EnvGuard does not claim to detect every secret or determine whether a matched value is valid. Review findings carefully and treat the severity as an estimate.

## Develop and contribute

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm exec envguard -- --help
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing and [SECURITY.md](SECURITY.md) before reporting a vulnerability. EnvGuard is available under the [MIT License](LICENSE).

## Roadmap

Planned extensions include more detectors, custom rule packages, editor integrations, optional AI explanations, and provider-specific rotation guidance. Core scanning will remain local-first and API-key-free.

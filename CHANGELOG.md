# Changelog

All notable changes to EnvGuard are documented here.

## v1.4.0

- Added modern AI token detection: OpenAI API keys (`sk-proj-...`, `sk-...`), Anthropic API keys (`sk-ant-...`), and Hugging Face tokens (`hf_...`).
- Added developer communication & email API detectors: SendGrid (`SG....`), Resend (`re_...`), and Twilio Account SID (`AC...`).
- Enhanced generic credential detection to match session secrets, JWT secrets, webhook secrets, encryption keys, and AWS secret access keys.
- Expanded placeholder suppression heuristics to minimize false alarms on placeholder strings (e.g. `insert_here`, `replace_me`, `enter_your_key`, `sample`).
- Fixed and synchronized CLI version string to match `package.json`.
- Added unit test coverage for new detectors and generic assignment patterns.

## v1.3.0

- Added `--min-severity` for scan and history commands.
- Added `output.minSeverity` configuration for project-wide severity filtering.
- Added `rules.allowlist` for reviewed, known-safe candidate patterns.
- Added validation and tests for allowlist patterns and severity values.

## v1.2.0

- Fixed Git hooks to use the installed EnvGuard CLI path, including global npm installations.
- Added local custom regex rules through `.envguard.yml`.
- Added validation for custom rule IDs, patterns, and severity values.
- Added a 10,000-file scan limit and sequential traversal for safer large-repository scanning.
- Added tests for custom rules, invalid configuration, and hook CLI-path behavior.

## v1.1.0

- Added possible GitLab token, npm token, and database connection-string detection.
- Added `envguard uninstall-hook` to safely restore a hook saved during installation.
- Preserved and ran an existing pre-commit hook before EnvGuard's staged scan.
- Added `envguard scan --verbose` for skipped-file and non-fatal read-warning details.
- Reduced URL-related entropy false positives and added regression coverage.

## v1.0.0

- First public release with local scanning, Git hooks, history scanning, JSON, SARIF, configuration, and GitHub Actions.

# Changelog

All notable changes to EnvGuard are documented here.

## v1.1.0

- Added possible GitLab token, npm token, and database connection-string detection.
- Added `envguard uninstall-hook` to safely restore a hook saved during installation.
- Preserved and ran an existing pre-commit hook before EnvGuard's staged scan.
- Added `envguard scan --verbose` for skipped-file and non-fatal read-warning details.
- Reduced URL-related entropy false positives and added regression coverage.

## v1.0.0

- First public release with local scanning, Git hooks, history scanning, JSON, SARIF, configuration, and GitHub Actions.

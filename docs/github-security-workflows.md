# GitHub Security Workflows

This document records the guarded GitHub Actions baseline used by the GoldWallet modernization branch.

## Workflows

- `codeql.yml` analyzes JavaScript and TypeScript on pushes and pull requests for `develop`, `main`, and `stage`, on a weekly schedule, and by manual dispatch. CodeQL uses `build-mode: none` and publishes results with `security-events: write` while repository contents remain read-only. GitHub permits code-scanning uploads triggered by `pull_request`, including fork and Dependabot pull requests.
- `semgrep.yml` replaces the archived `semgrep-action` wrapper with the native Semgrep CLI. The official Semgrep image is pinned by version and digest, the scan produces SARIF, and the report is retained as an artifact when SARIF was created. The same `pull_request` code-scanning exception keeps SARIF publication visible for untrusted fork and Dependabot changes.
- `pull-request.yml` validates pull request metadata with `pull_request_target` so public fork contributions are supported. This is the only workflow allowed to use that event: it does not check out or execute repository code, has no shell steps, and reads the built-in `github.token` with pull-request metadata permissions only.

## Supply-Chain Policy

Third-party actions must use approved full commit SHAs with a human-readable version comment. Container images must use an explicit version and immutable digest. Floating tags, extra unapproved actions, `pull_request_target` outside the metadata-only title workflow, write-all permissions, persisted checkout credentials, arbitrary secret expressions, and the archived Semgrep action are rejected by `corepack yarn check:github-security-workflows-guard`.

The currently guarded upstream baseline, verified from official GitHub/PyPI/Docker metadata on `2026-07-16`, is:

- `actions/checkout` `v7.0.0`;
- `github/codeql-action` `v4.37.1`;
- `amannn/action-semantic-pull-request` `v6.1.1`;
- `semgrep/semgrep` `1.170.0`.

Pin updates require a fresh upstream metadata check, an offline guard update, YAML parsing, and the same review as executable code. Scheduled and manual workflows become available after their definitions reach the default branch.

The `p/...` Semgrep registry packs are resolved at scan time and can change independently of the pinned image. That is intentional for current security coverage but means findings are timestamped evidence rather than a byte-for-byte reproducible gate; changing the guarded pack list still requires review.

The first full local scan with this exact image and rule set completed in `14m 41s`, scanned `988` tracked files with `277` effective rules, and produced `24` legacy findings. The workflow therefore uses a 30-minute timeout and keeps findings reporting-only for this migration milestone; scanner/configuration failures still fail the job. The findings must be reviewed in a separate security-remediation block before `--error` can become a guarded blocking policy.

## Local Validation

Run:

```powershell
corepack yarn check:github-security-workflows-guard
corepack yarn android:dev:check-light
```

The offline guard validates workflow structure and supply-chain invariants. It does not claim that GitHub-hosted CodeQL, Semgrep registry downloads, or SARIF publication ran successfully; those claims require an actual GitHub Actions run after push.

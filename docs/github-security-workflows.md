# GitHub Security Workflows

This document records the guarded GitHub Actions baseline used by the GoldWallet modernization branch.

## Workflows

- `codeql.yml` analyzes JavaScript and TypeScript on pushes and pull requests for `develop`, `main`, and `stage`, on a weekly schedule, and by manual dispatch. CodeQL uses `build-mode: none` and publishes results with `security-events: write` while repository contents remain read-only. GitHub permits code-scanning uploads triggered by `pull_request`, including fork and Dependabot pull requests.
- `semgrep.yml` replaces the archived `semgrep-action` wrapper with the native Semgrep CLI. The official Semgrep image is pinned by version and digest and runs through Docker on the Ubuntu host. The scan produces SARIF, validates it against the reviewed baseline, and retains the report even when the baseline gate fails. The same `pull_request` code-scanning exception keeps SARIF publication visible for untrusted fork and Dependabot changes.
- `pull-request.yml` validates pull request metadata with `pull_request_target` so public fork contributions are supported. This is the only workflow allowed to use that event: it does not check out or execute repository code, has no shell steps, and reads the built-in `github.token` with pull-request metadata permissions only.

## Supply-Chain Policy

Third-party actions must use approved full commit SHAs with a human-readable version comment. Container images must use an explicit version and immutable digest. Floating tags, extra unapproved actions, `pull_request_target` outside the metadata-only title workflow, write-all permissions, persisted checkout credentials, arbitrary secret expressions, and the archived Semgrep action are rejected by `corepack yarn check:github-security-workflows-guard`.

The currently guarded upstream baseline, verified from official GitHub/PyPI/Docker metadata on `2026-07-16`, is:

- `actions/checkout` `v7.0.0`;
- `github/codeql-action` `v4.37.1`;
- `amannn/action-semantic-pull-request` `v6.1.1`;
- `semgrep/semgrep` `1.170.0`.

Pin updates require a fresh upstream metadata check, an offline guard update, YAML parsing, and the same review as executable code. Scheduled and manual workflows become available after their definitions reach the default branch.

The `p/...` Semgrep registry packs are resolved at scan time and can change independently of the pinned image. The reviewed `.github/semgrep-baseline.json` makes that drift visible: a new, removed, moved, edited, or duplicated finding fails the gate and requires explicit review. Changing the guarded pack list or baseline still requires the same security review as executable code.

The reviewed baseline contains 22 accepted findings: 20 local maintenance helpers that invoke fixed developer tools, the required exported Android launcher activity, and the certificate-readiness diagnostic that intentionally inspects invalid TLS metadata before failing strict readiness. Two Dependabot cooldown findings were remediated with an explicit seven-day policy instead of being accepted. Every entry records its exact rule, path, snippet hash, full-file hash, occurrence count, and rationale; no raw finding text is committed. Any change to a file containing an accepted finding requires renewed baseline review, even when the sink line itself is unchanged. Secret and credential rules cannot be baselined.

The checker rejects failed scanner invocations and every execution/configuration notification except two exact `warning / Syntax error` execution notifications for generated Gradle wrapper scripts whose normalized full-file hashes match the reviewed values. Timeouts, resource limits, configuration failures, application parse warnings, and repository-tooling parse warnings fail closed.

The scan disables inline `nosem` suppression and ignores repository `.semgrepignore` files through the pinned Semgrep 1.170 CLI option. Pull-request code therefore cannot hide tracked findings before SARIF generation; any future scanner-version update must revalidate this guarded option.

For pull requests, the scan runs against the proposed source, but the checker is loaded after scanning from the pull request base SHA. Proposed baseline changes remain visible in the pull-request diff and are interpreted only by that trusted checker. During the initial rollout, when the base SHA has no checker yet, the source checker is copied only after its SHA-256 matches the checksum pinned in the guarded workflow. Push runs use their current SHA. The workflow keeps scanner, policy, and baseline failures non-terminal until SARIF upload and artifact retention have run, then fails explicitly from the recorded step outcomes.

## Local Validation

Run:

```powershell
corepack yarn check:github-security-workflows-guard
corepack yarn check:semgrep-sarif-baseline-guard
corepack yarn android:dev:check-light
```

The offline guard validates workflow structure and supply-chain invariants. It does not claim that GitHub-hosted CodeQL, Semgrep registry downloads, or SARIF publication ran successfully; those claims require an actual GitHub Actions run after push.

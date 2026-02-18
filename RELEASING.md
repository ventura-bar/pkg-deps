# Release Guide

This document outlines the release process for `pkg-deps`.

## 1. Prerequisites
- **NPM Trusted Publishing**: The repository is configured to authenticate with NPM via OIDC. No explicit token is required in secrets.
- **GitHub Actions**: The workflow file `.github/workflows/release.yml` handles the automation.

## 2. Release Workflow

### Production (Stable)
*   **Branch**: `main`
*   **Trigger**: Manual (GitHub Actions -> "Release Manager" -> Run workflow).
*   **Install**: `npm install pkg-deps`
*   **Process**: Prompts for version type (patch/minor/major), creates a release, and publishes to `latest` tag.

### Beta (Pre-Release)
*   **Branch**: `dev`
*   **Trigger**: **Automatic** on every push to `dev`.
*   **Install**: `npm install pkg-deps@beta`
*   **Process**: Auto-increments pre-release version (e.g., `2.0.7-beta.0`) and publishes to `beta` tag.

---

## 3. Commit Message Convention (Gitmoji)
We use a combination of **Gitmoji** and **Conventional Commits** to generate the CHANGELOG.md.

**Format**: `<emoji> <type>(<scope>): <subject>`

### Common Types:
*   ✨ `feat:` -> Minor version bump (New features)
*   🐛 `fix:` -> Patch version bump (Bug fixes)
*   ⚡️ `perf:` -> Patch version bump (Performance improvements)
*   🔧 `chore:` -> No release trigger (Configuration, cleanup)
*   📝 `docs:` -> No release trigger (Documentation)
*   ✅ `test:` -> No release trigger (Testing)
*   ♻️ `refactor:` -> No release trigger (Code refactoring)
*   💥 `BREAKING CHANGE:` -> Major version bump

### Examples:
```bash
git commit -m "✨ feat(core): add new bundling logic"
git commit -m "🐛 fix(ci): resolve npm authentication error"
git commit -m "📝 docs: update readme"
```

## 4. Manual Verification (Dry Run)
You can verify the release process without actually publishing by running locally:

```bash
# Verify changelog and version bump
npm run release -- --dry-run
```

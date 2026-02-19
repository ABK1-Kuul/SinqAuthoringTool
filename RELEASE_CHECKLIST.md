# SINQ Authoring Tool — Final Release Checklist

Use this checklist before building and distributing the production installer.

---

## 1. Pre-Build Cleanup

- [ ] **Dependencies:** Run `npm prune --production` (locally or in CI) to ensure no devDependencies (mocha, jshint, electron-reload, etc.) bloat the installer.  
  - *Note:* Run this after `npm run build:frontend` but before `electron-builder`; use a separate staging copy if your build script needs devDependencies to run.

- [ ] **Secrets:** Double-check that no `.session-key` or `testConfig.json` files are present in the `conf/` directory.
  - `.session-key` is gitignored; production uses `userData/config/` (Electron) or `conf/` (CLI).
  - `testConfig.json` belongs in `test/` only—never in `conf/`.

---

## 2. Environmental Verification

- [ ] **Node Version:** Ensure the build machine runs Node.js 18 or 20 (per `package.json` engines).

- [ ] **Binary Check:** Verify `resources/mongodb/bin/` contains the correct `mongod.exe` (or `mongod` on macOS/Linux).
  - Run `node verify-platform.js` to confirm platform detection.
  - For macOS: ensure `chmod +x` on the binary if needed.

---

## 3. Security Audit (Manual Pass)

- [ ] **CSP Test:** Launch the app and open DevTools Console. Ensure there are no "Refused to load..." errors for legitimate resources, especially during Adapt course previews.

- [ ] **Session Check:** On first launch, verify a unique `.session-key` is generated in the user's data folder (`userData/config/` for Electron) and that it is **not** inside the app's installation directory (so it survives updates).

---

## 4. Packaging & Distribution

- [ ] **Installer Logic:** Run the installer on a "clean" machine (no Node.js or MongoDB installed) to verify:
  - `check-env.js` preflight correctly identifies a healthy environment.
  - Missing `mongod.exe` shows a clear error dialog instead of a hang.

- [ ] **Code Signing (Recommended):** If distributing to external users:
  - **Windows:** Sign the `.exe` with a code-signing certificate to avoid SmartScreen warnings.
  - **macOS:** Notarize the `.dmg`/`.app` to satisfy Gatekeeper.

---

## Quick Commands

```bash
# 1. Full build (requires devDependencies)
npm run build:frontend
npm run build:electron:win

# 2. Optional: prune before packaging (run after frontend build, before electron-builder)
#    Note: build:electron:win runs both; for CI, consider a two-step build with prune in between.
npm prune --production

# 3. Verify packaged output
npm run verify:packaged
```

---

*Last updated: Phase 5 — Production Readiness*

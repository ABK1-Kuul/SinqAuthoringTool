# Release Notes - v0.11.5

## What's New & Fixed in v0.11.5

This release primarily focuses on resolving critical startup and packaging issues for the ElectronStandalone application, ensuring a smooth, zero-config experience out of the box.

### 🐛 Bug Fixes
- **Module Resolution & Packaging Crashes**
  - Resolved `Cannot find module` errors on startup for critical dependencies (`q`, `bower-logger`, `mout`, `bower-config`, `configstore`). Nested dependencies that were occasionally omitted by newer npm versions are now explicitly included.
  - Fixed a module path issue in `setup.js` where the app incorrectly expected a `backend/` subfolder.
- **MongoDB Startup & Paths**
  - **Path Resolution:** Fixed `mongod.exe` binary path resolution to work accurately in both packaged and development modes.
  - **Error Handling:** Improved MongoDB process error handling. Added binary existence checks, stderr capturing for easier debugging, and robust process event handling.

### 🛠️ Build & Packaging Improvements
- **Verification Script:** Introduced an automated post-build verification script (`scripts/verify-packaged-modules.js`) to guarantee all critical modules are correctly bundled in the `.exe` before distribution.
- **Dependency Reliability:** The build process now strictly packages the exact necessary dependency tree, ensuring consistency across environments. 

## Known Issues / Next Steps
- First-time users will be presented with a setup wizard to initialize the configuration. If the backend fails to connect, ensure that no other service is occupying port `27018`.
- If installing over an older version, please uninstall the previous "SINQ Authoring Tool" before running the new `SINQ Authoring Tool Setup 0.11.5.exe`.

## Technical Details
- **Engine Requirement:** Node.js >= 18 is strictly required for consistent building and behavior.
- **Architecture:** Portable Windows Executable (`.exe`) bundling Node runtime, Chromium via Electron, and a portable MongoDB.

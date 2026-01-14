# Module Packaging Fix - Permanent Solution

## Problem Summary

The Electron application was crashing on startup with "Cannot find module" errors for various dependencies, particularly:
- `q`
- `bower-logger`
- `mout`
- `bower-config`
- `configstore`

## Root Cause

**Primary Cause: Environment Mismatch**
- Building with Node 25/npm 11 instead of required Node 16/18 (per `engines` in `package.json`)
- Newer npm versions handle dependency resolution differently, causing nested dependencies to be omitted during packaging

**Secondary Cause: Missing Explicit Dependencies**
- Bower bundles its dependencies in nested `node_modules`, but these weren't being packaged correctly
- Critical nested dependencies weren't explicitly listed in `package.json`, so they weren't guaranteed to be included

## Permanent Fix Applied

### 1. Added Explicit Dependencies
Added the following critical modules to `package.json` dependencies:
```json
{
  "q": "^1.5.1",
  "bower-logger": "^0.2.2",
  "mout": "^1.2.4",
  "bower-config": "^1.4.3",
  "configstore": "^3.1.2"
}
```

### 2. Created Verification Script
Created `scripts/verify-packaged-modules.js` to check for all critical modules after packaging.

### 3. Integrated into Build Process
Added `verify:packaged` script and integrated it into the build:
```json
{
  "scripts": {
    "verify:packaged": "node scripts/verify-packaged-modules.js",
    "build:electron:win": "npm run build:frontend && electron-builder --win nsis && npm run verify:packaged"
  }
}
```

## How to Verify the Fix

1. **Run the verification script manually:**
   ```bash
   npm run verify:packaged
   ```

2. **Or check specific modules:**
   ```powershell
   Test-Path dist\win-unpacked\resources\app\node_modules\configstore
   Test-Path dist\win-unpacked\resources\app\node_modules\bower-logger
   ```

3. **Install and test the app:**
   - Uninstall any existing "SINQ Authoring Tool"
   - Install `dist\SINQ Authoring Tool Setup 0.11.5.exe`
   - Launch the app - it should start without module errors

## Best Practices to Prevent Recurrence

### 1. **Always Build with Supported Node Version**
   ```bash
   # Use nvm or nvs to switch to Node 16 or 18
   nvm use 18
   # Verify
   node -v  # Should show 16.x or 18.x
   ```

### 2. **Use `npm ci` Instead of `npm install`**
   ```bash
   npm ci  # Uses package-lock.json exactly, ensures consistent dependency tree
   ```

### 3. **Explicitly List Critical Nested Dependencies**
   - If a package has nested dependencies that are critical, add them explicitly to `package.json`
   - This ensures they're always packaged, regardless of npm version behavior

### 4. **Run Verification After Every Build**
   - The build process now automatically runs verification
   - If verification fails, fix missing modules before distributing

### 5. **Check for Missing Modules Proactively**
   - If you encounter a "Cannot find module" error:
     1. Add the missing module to `package.json` dependencies
     2. Run `npm install <module-name> --save`
     3. Rebuild: `npm run build:electron:win`
     4. Verify: `npm run verify:packaged`

## Current Status

✅ All critical modules are now explicitly listed in `package.json`
✅ Verification script confirms all modules are packaged correctly
✅ Build process includes automatic verification
✅ Installer ready: `dist\SINQ Authoring Tool Setup 0.11.5.exe`

## Critical Modules List

The following modules are verified after each build:
- `bower`, `bower-config`, `bower-logger`
- `mout`, `q`
- `configstore` and its dependencies: `dot-prop`, `graceful-fs`, `make-dir`, `unique-string`, `write-file-atomic`, `xdg-basedir`
- Core app dependencies: `fs-extra`, `express`, `mongoose`, `async`, `underscore`

## Troubleshooting

If you still encounter missing module errors:

1. **Check the exact module name from the error message**
2. **Verify it exists in local `node_modules`:**
   ```bash
   Test-Path node_modules\<module-name>
   ```
3. **Add it explicitly to `package.json` if it's a nested dependency**
4. **Rebuild and verify:**
   ```bash
   npm run build:electron:win
   npm run verify:packaged
   ```

## Notes

- The fix is permanent because all critical dependencies are now explicitly listed
- The verification script catches issues before distribution
- Building with Node 16/18 ensures consistent behavior across environments


# Development Guide

This document explains how to develop and test the SINQ Authoring Tool in development mode without building executables.

## Quick Start

To run the application in development mode:

```bash
npm run dev
```

This single command will:
1. Build the frontend in development mode (optimized for faster builds)
2. Start Electron with development features enabled
3. Automatically open Chrome DevTools
4. Enable auto-reload functionality

## Available Scripts

### Development Scripts

- **`npm run dev`** - Build frontend and start Electron in development mode
  - Builds frontend with `grunt build:dev` (faster, with source maps)
  - Starts Electron with auto-reload and DevTools enabled

- **`npm start`** - Start Electron (assumes frontend is already built)
  - Use this if you've already built the frontend and just want to restart Electron

- **`npm run build:frontend:dev`** - Build frontend in development mode only
  - Faster builds, includes source maps for debugging
  - Use this if you only want to rebuild the frontend without starting Electron

### Production Scripts

- **`npm run build:frontend`** - Build frontend in production mode
  - Optimized, minified build for production
  - Used automatically when building the installer

- **`npm run build:electron:win`** - Build Windows installer (.exe)
  - Builds frontend in production mode
  - Packages the app with electron-builder
  - Verifies all critical modules are included

## Development Features

### Automatic Reload

The development mode includes automatic reload functionality:

1. **Main Process Files** (`electron/**/*.js`, `lib/**/*.js`):
   - Changes trigger a **full app restart**
   - Electron will exit and relaunch automatically
   - This ensures all main process code changes are picked up

2. **Frontend Files** (`frontend/src/**/*`, `frontend/build/**/*`):
   - Changes trigger a **window reload only** (faster)
   - The app stays running, only the renderer process reloads
   - Debounced to 300ms to avoid multiple reloads for batch changes

### Chrome DevTools

- DevTools open automatically in development mode
- Available for both the main application window and setup wizard
- Close manually if needed, they'll reopen on next window creation

### Development Mode Detection

The app uses `electron-is-dev` to detect development mode:
- Development: When running with `npm run dev` or `npm start` from source
- Production: When running from a packaged .exe installer

This ensures:
- Dev-only code (auto-reload, DevTools) is never included in production builds
- Production builds are optimized and secure

## Development Workflow

### Typical Development Session

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Edit files:**
   - **Frontend files** (`frontend/src/**/*`): Edit and save → Window auto-reloads
   - **Main process files** (`electron/**/*.js`): Edit and save → App auto-restarts
   - **Backend files** (`lib/**/*.js`): Edit and save → App auto-restarts

3. **Frontend Development:**
   - If you make extensive frontend changes, you may need to rebuild:
     ```bash
     npm run build:frontend:dev
     ```
   - The window will auto-reload when build files change

4. **Debugging:**
   - Use Chrome DevTools (already open) to debug renderer process
   - Use VS Code debugger or `console.log()` for main process debugging
   - Backend logs appear in the terminal where you ran `npm run dev`

### File Watching Details

The auto-reload system watches:
- `electron/**/*.js` - Electron main process
- `lib/**/*.js` - Backend server code
- `frontend/src/**/*` - Frontend source files
- `frontend/build/**/*` - Compiled frontend files

Ignored files:
- `node_modules/**` - Dependencies
- Hidden files (`.` prefix)
- Source maps (`.map` files)
- Log files (`.log` files)

## Troubleshooting

### App doesn't auto-reload

- Check that you're running in development mode (`npm run dev`)
- Verify the file you changed is in a watched directory
- Check the terminal for any error messages
- Try manually restarting with `Ctrl+C` and `npm run dev` again

### Frontend changes not appearing

- Ensure frontend is built: `npm run build:frontend:dev`
- Check that the file is in `frontend/src` or `frontend/build`
- Verify the browser window reloaded (check console for "[dev] Frontend files changed" message)
- Hard refresh the window: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### DevTools not opening

- Verify you're in development mode (not production build)
- Check `electron-is-dev` is detecting dev mode correctly
- Manually open DevTools: `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)

### MongoDB connection issues in development

- MongoDB starts automatically via `electron/services/mongodb.js`
- Check the MongoDB log: `%APPDATA%\SINQ_authoring\mongodb\mongod.log`
- Ensure port 27018 is available (not used by another MongoDB instance)

## Notes

- **No .exe building required** for development - run directly from source
- **Production builds** are completely separate and use optimized, minified code
- **All dev-only code** is conditionally loaded, so production builds remain secure
- The development setup is **Windows-compatible** and works cross-platform

## Architecture

The development workflow separates concerns:

1. **Frontend Build** (Grunt): Compiles Less, Handlebars, bundles JavaScript
2. **Backend Server** (Express): Runs on localhost:3000, serves the frontend
3. **Electron Main Process**: Manages windows, MongoDB, backend lifecycle
4. **Electron Renderer Process**: Loads the frontend from the backend server

This architecture allows:
- Hot reload of frontend without restarting the backend
- Fast iteration on UI changes
- Proper separation of main process and renderer process reloads

# Shipping a Windows `.exe` for SINQ Authoring Tool

Goal: produce a double-clickable Windows executable that bundles Node.js and this codebase so users can start the SINQ Authoring server locally.

> The app still needs MongoDB and writeable data directories. Either point at an existing MongoDB or bundle a portable MongoDB (see Electron path below).

---

## Pack with `pkg` (Node-only exe)

This keeps the app headless (runs in a console, opens browser separately).

### 1) Prerequisites

- Windows 10/11 x64.
- Node.js 18.x (matches `engines` in `package.json`).
- Git and 7zip/PowerShell (for optional bundling).
- Enough disk space (exe plus assets is several hundred MB).

### 2) One-time setup

```pwsh
git clone https://github.com/adaptlearning/adapt_authoring.git
cd adapt_authoring
npm ci
# build frontend + set production flag in conf/config.json if present
npx grunt build:prod
# add packager dependency
npm i -D pkg
```

### 3) Add `pkg` configuration

Update `package.json`:

```jsonc
{
  "bin": "server.js",
  "scripts": {
    "build:exe:win": "pkg . --targets node18-win-x64 --output dist/sinq-authoring.exe"
  },
  "pkg": {
    "assets": [
      "frontend/**/*",
      "routes/**/*",
      "lib/**/*",
      "plugins/**/*",
      "migrations/**/*",
      "conf/**/*",
      "install.js",
      "upgrade.js"
    ],
    "targets": ["node18-win-x64"],
    "outputPath": "dist"
  }
}
```

Notes:

- `bin` points pkg at the runtime entry (`server.js` calls `lib/application().run()`).
- `assets` keeps templates, static files, configs, and plugins outside the JS snapshot so dynamic loads work.
- If you keep a custom `conf/config.json` for production, commit or copy it before packaging.

### 4) Build the exe

```pwsh
npm run build:exe:win
# output: dist\sinq-authoring.exe
```

### 5) Assemble the distributable

Create a clean folder, e.g. `release-win/`, containing:

- `sinq-authoring.exe` (from `dist/`).
- `conf/` (prepopulated `conf/config.json`, language files, etc.).
- `frontend/`, `routes/`, `plugins/`, `lib/`, `migrations/` (ship alongside so dynamic requires resolve; pkg also snapshots them).
- `data/` folder(s) where uploads/exports should be written (ensure writable).
- Optional launcher script (below).

**Launcher (`start-authoring.bat`):**

```bat
@echo off
setlocal
set PORT=3000
start "" "%~dp0sinq-authoring.exe" --port %PORT%
timeout /t 4 >nul
rem Remove the next line if you do NOT want to open the browser automatically
start "" http://localhost:%PORT%
```

Place the `.bat` next to the exe; users can double-click either file.

### 6) Test the pkg build

On a clean Windows machine:

1. Double-click `start-authoring.bat` or `sinq-authoring.exe`.
2. Verify the console shows “Listening on …” and the browser opens `http://localhost:3000` (or your configured port).
3. Create a test course, upload an asset, and export to ensure file I/O works where expected.

### Optional: bundle MongoDB with `pkg`

If you do not want users to install MongoDB:

1. Download a portable MongoDB ZIP for Windows x64 and place it in `mongodb/` beside the exe (e.g. `mongodb/bin/mongod.exe`).
2. Add a data folder, e.g. `mongodb/data`.
3. Create `start-all.bat`:

```bat
@echo off
setlocal
set MONGO_PORT=27017
set APP_PORT=3000
set DBPATH=%~dp0mongodb\data
start "" "%~dp0mongodb\bin\mongod.exe" --dbpath "%DBPATH%" --port %MONGO_PORT% --quiet
timeout /t 3 >nul
start "" "%~dp0sinq-authoring.exe" --dbHost 127.0.0.1 --dbPort %MONGO_PORT% --port %APP_PORT%
timeout /t 4 >nul
start "" http://localhost:%APP_PORT%
```

1. Ensure `conf/config.json` matches `dbHost`, `dbPort`, and `dbName`.
2. Run `start-all.bat` to launch MongoDB and the app.

### pkg troubleshooting

- **Missing assets/templates**: confirm `pkg.assets` covers the path being read; re-run `npm run build:exe:win`.
- **Dynamic `require` failures**: keep `plugins/` and similar folders on disk alongside the exe.
- **Port in use**: pass `--port 3001` (or edit the launcher).
- **MongoDB connection errors**: verify `conf/config.json` and that MongoDB is running (or use the bundled approach).

---

## Electron + Portable MongoDB (desktop-style, double-clickable)

Wraps the server in Electron and ships a portable MongoDB so the user only needs to unzip and double-click. Electron launches `mongod`, then starts the Adapt server, then opens a BrowserWindow at `http://localhost:<port>`.

### Overview

- `electron/main.js` — boots MongoDB (portable), boots the Adapt server, opens the UI window.
- `tools/mongodb-win64/**` — portable MongoDB binaries you download (unzipped).
- `conf/config.json` — prefilled to point at the bundled MongoDB (localhost, chosen port).
- `package.json` — Electron scripts + `electron-builder` config to emit a portable `.exe`.

### 1) Prerequisites (builder machine)

- Windows 10/11 x64.
- Node.js 18.x.
- 7zip/PowerShell (to unpack MongoDB).
- A portable MongoDB Community Server ZIP (x64), e.g. 7.0.x.

### 2) Layout the portable MongoDB

```text
adapt_authoring/
  tools/
    mongodb-win64/
      bin/mongod.exe
      bin/mongo.exe
      ... (other binaries)
```

Ensure `tools/mongodb-win64/bin/mongod.exe` exists after unzip.

### 3) Install Electron tooling

```pwsh
npm i -D electron electron-builder electron-is-dev wait-on cross-env
```

### 4) Add an Electron entrypoint

Create `electron/main.js` (keeps everything inside the Electron window—no external browser opens):

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

const resources = process.resourcesPath || path.join(__dirname, '..');
const mongoDir = path.join(resources, 'tools', 'mongodb-win64', 'bin');
const mongoData = path.join(app.getPath('userData'), 'mongodb-data');
const mongoPort = 27017;
const appPort = 3000;

let mongoProc;
let serverProc;

function startMongo() {
  return spawn(path.join(mongoDir, 'mongod.exe'), [
    `--dbpath=${mongoData}`,
    `--port=${mongoPort}`,
    '--quiet'
  ], { stdio: 'ignore', windowsHide: true });
}

function startServer() {
  return spawn(process.execPath, [
    path.join(resources, 'server.js'),
    '--dbHost', '127.0.0.1',
    '--dbPort', mongoPort,
    '--port', appPort
  ], {
    cwd: resources,
    stdio: 'ignore',
    windowsHide: true
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { contextIsolation: true }
  });
  win.removeMenu();
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadURL(`http://localhost:${appPort}`);
}

app.whenReady().then(async () => {
  mongoProc = startMongo();
  serverProc = startServer();
  await waitOn({ resources: [`http://localhost:${appPort}`], timeout: 20000 });
  createWindow();
});

app.on('window-all-closed', () => { app.quit(); });
app.on('quit', () => {
  if (serverProc) serverProc.kill();
  if (mongoProc) mongoProc.kill();
});
```

Notes:

- `process.execPath` is the bundled Node runtime inside the Electron build.
- `process.resourcesPath` resolves to the unpacked `app` folder at runtime; we place Mongo there via `extraResources` below.

### 5) Update `package.json` for Electron build

Add scripts and builder config (merge with what you have):

```jsonc
{
  "main": "electron/main.js",
  "scripts": {
    "build:frontend": "grunt build:prod",
    "build:electron:win": "npm run build:frontend && electron-builder --win portable"
  },
  "build": {
    "appId": "org.adapt.authoring",
    "productName": "SINQ Authoring",
    "files": [
      "server.js",
      "index.js",
      "lib/**/*",
      "frontend/**/*",
      "routes/**/*",
      "plugins/**/*",
      "migrations/**/*",
      "conf/**/*",
      "install.js",
      "upgrade.js",
      "electron/**/*"
    ],
    "extraResources": [
      { "from": "tools/mongodb-win64", "to": "tools/mongodb-win64" }
    ],
    "win": {
      "target": [
        { "target": "portable", "arch": ["x64"] }
      ]
    }
  }
}
```

`extraResources` ensures MongoDB binaries sit outside the ASAR so `mongod.exe` can be spawned.

### 6) Prepare config for bundled MongoDB

Set `conf/config.json` to point at the local Mongo instance (or rely on CLI args in `main.js`):

```json
{
  "dbHost": "127.0.0.1",
  "dbPort": 27017,
  "dbName": "adapt-authoring",
  "sessionSecret": "change-me",
  "smtp": { "host": "", "port": 0 }
}
```

### 7) Build the portable Electron app

```pwsh
npm run build:electron:win
# output: dist/SINQ Authoring.exe (portable)
```

### 8) Ship to users

Deliver the generated `.exe` (portable build). User steps:

1. Double-click `SINQ Authoring.exe`.
2. Electron starts MongoDB into its userData folder, starts the SINQ Authoring server, then opens the UI window.
3. Data (courses, uploads) persist under `%AppData%/SINQ Authoring/` unless you configure custom paths.

### 9) Notes and gotchas

- **Startup timing**: `wait-on` waits for the HTTP port before showing the window; adjust timeout if needed.
- **Ports**: change `mongoPort` / `appPort` in `electron/main.js` to avoid conflicts.
- **File writes**: ensure upload/export destinations are writable; Electron userData is per-user and writable by default.
- **Updates**: re-run `npm run build:electron:win` after pulling code changes; update portable MongoDB binaries only when upgrading Mongo.

With these steps, you get a single portable `.exe` that bundles Electron, Node, SINQ Authoring Tool, and a portable MongoDB—users just double-click to run.

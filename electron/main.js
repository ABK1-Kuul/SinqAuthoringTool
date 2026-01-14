const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const isDev = require('electron-is-dev');
const http = require('http');
const mongodbService = require('./services/mongodb');
const migrationsService = require('./services/migrations');
const backendService = require('./services/backend');
const setupService = require('./services/setup');
const installationService = require('./services/installation');
const smtpService = require('./services/smtp');
const installHelpers = require('../lib/installHelpers');

// Global error handlers - catch unhandled errors gracefully
process.on('uncaughtException', (error) => {
  console.error('[main] Uncaught Exception:', error);
  // Connection reset errors are often non-fatal (network hiccups, etc.)
  if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'EPIPE') {
    console.warn('[main] Connection error (non-fatal):', error.message);
    return; // Don't crash on connection errors
  }
  // For other errors, log but don't show dialog in dev mode
  if (!isDev) {
    const { dialog } = require('electron');
    dialog.showErrorBox('Application Error', 
      `An unexpected error occurred:\n\n${error.message}`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[main] Unhandled Rejection at:', promise, 'reason:', reason);
  // Connection errors are often recoverable
  if (reason && (reason.code === 'ECONNRESET' || reason.code === 'ECONNREFUSED' || reason.code === 'EPIPE')) {
    console.warn('[main] Connection error (non-fatal):', reason.message);
    return;
  }
});

// Enable auto-reload in development mode only
// This watches for changes and handles reloads/restarts automatically
if (isDev) {
  try {
    // Require electron-reload only in development to avoid bundling it in production
    // Watch only main process files - changes here will trigger full app restart
    // Frontend files are handled separately below with window reload only
    
    // Use the electron package path directly - it handles platform differences
    // The electron package exports the path to the executable
    const electronPkg = require('electron');
    const electronPath = typeof electronPkg === 'string' ? electronPkg : (electronPkg.path || process.execPath);
    
    require('electron-reload')(
      [
        // Watch electron directory (main process files) - triggers full app restart
        path.join(__dirname, '**', '*.js'),
        // Watch backend lib directory - triggers full app restart
        path.join(__dirname, '..', 'lib', '**', '*.js'),
      ],
      {
        // Path to electron binary for restarting
        electron: electronPath,
        // Use exit method for clean restarts
        hardResetMethod: 'exit',
        // Ignore node_modules, hidden files, and source maps
        ignored: [/node_modules/, /[/\\]\./, /\.map$/, /\.log$/],
        // Watch configuration
        chokidar: {
          ignoreInitial: true,
        },
      }
    );
    
    console.log('[dev] Auto-reload enabled for main process files (app will restart on changes)');
    console.log('[dev] Frontend files will trigger window reload only (see createWindow function)');
  } catch (err) {
    console.warn('[dev] Failed to enable electron-reload:', err.message);
    console.warn('[dev] Continuing without auto-reload...');
  }
}

// In unit tests (Node only) Electron's app may be undefined, so fall back to a local path
function getUserDataPath() {
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData');
    }
  } catch (err) {
    // ignore and fall through to default
  }
  return path.join(process.cwd(), 'userData');
}

const USER_DATA = getUserDataPath();
const DEFAULT_PORT = 3000;
const CONFIG_PATH = path.join(USER_DATA, 'config', 'config.json');
const APP_ICON = (() => {
  const ico = path.join(__dirname, '..', 'resources', 'icon.ico');
  const png = path.join(__dirname, '..', 'resources', 'icon.png');
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
})();
let appMenuSet = false;

let mainWindow;
let wizardWindow;

function setMainMenu() {
  if (appMenuSet) return;
  const template = [
    {
      label: 'File',
      submenu: [
        ...(isDev ? [{ role: 'reload' }] : []),
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'SINQ Authoring Tool',
              message: 'SINQ Authoring Tool',
              detail: `Version: ${app.getVersion()}`,
            });
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  appMenuSet = true;
}

function isAllowedUrl(url, allowedOrigins = []) {
  return allowedOrigins.some(origin => url.startsWith(origin));
}

function lockNavigation(win, allowedOrigins = []) {
  if (!win || win.isDestroyed()) return;
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url, allowedOrigins)) {
      event.preventDefault();
    }
  });
  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}

function waitForBackendReady(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 2000 }, res => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`Backend not reachable on port ${port}`));
        }
        setTimeout(check, 250);
      });
    };
    check();
  });
}

function baseDefaults() {
  return {
    serverPort: DEFAULT_PORT,
    serverName: 'localhost',
    dataRoot: path.join(app.getPath('userData'), 'data'),
    dbType: 'mongoose',
    dbHost: '127.0.0.1',
    dbPort: 27017,
    dbName: 'adapt-tenant-master',
    outputPlugin: 'adapt',
    auth: 'local',
    sessionSecret: require('crypto').randomBytes(64).toString('hex'),
    installed: false,
    masterTenant: {
      name: 'master',
      displayName: 'Master',
    },
    admin: {
      email: '',
      password: '',
    },
    smtp: {
      enabled: false,
      service: '',
      host: '',
      port: 0,
      username: '',
      password: '',
      fromAddress: '',
      connectionUrl: '',
      rootUrl: '',
    },
  };
}

async function loadConfig() {
  if (await fs.pathExists(CONFIG_PATH)) {
    const cfg = await fs.readJson(CONFIG_PATH);
    return normalizeConfig(cfg);
  }
  const defaults = baseDefaults();
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  const normalized = normalizeConfig(defaults);
  await fs.writeJson(CONFIG_PATH, normalized, { spaces: 2 });
  return normalized;
}

function normalizeConfig(cfg) {
  const normalized = {
    ...cfg,
    dbHost: '127.0.0.1',
    dbPort: mongodbService.MONGO_PORT,
  };
  return normalized;
}

async function createWindow(port) {
  setMainMenu();
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable DevTools in development mode only
      devTools: isDev,
    },
  });
  mainWindow.removeMenu();
  lockNavigation(mainWindow, [`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  await waitForBackendReady(port).catch(err => {
    console.warn('[main] Backend readiness check failed:', err.message);
  });
  mainWindow.loadURL(`http://127.0.0.1:${port}`);
  
  // Automatically open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
    
    // Set up file watcher for frontend files to reload renderer without restarting app
    // This provides faster feedback when editing UI files
    // Note: fs-extra extends native fs, so fs.watch is available
    const frontendPaths = [
      path.join(__dirname, '..', 'frontend', 'build'),
      path.join(__dirname, '..', 'frontend', 'src'),
    ];
    
    let reloadTimer = null;
    const scheduleReload = () => {
      // Debounce reload to avoid multiple reloads for batch file changes
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('[dev] Frontend files changed, reloading renderer...');
          mainWindow.reload();
        }
      }, 300);
    };
    
    // Watch frontend directories for changes
    // Using native fs.watch (available via fs-extra) for cross-platform compatibility
    frontendPaths.forEach(watchPath => {
      try {
        if (fs.existsSync(watchPath)) {
          // fs-extra includes native fs.watch
          fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename && !filename.includes('node_modules') && !filename.startsWith('.')) {
              scheduleReload();
            }
          });
        }
      } catch (err) {
        // Ignore watch errors (e.g., path doesn't exist yet, or recursive not supported on some systems)
        console.warn(`[dev] Could not watch ${watchPath}:`, err.message);
      }
    });
    
    // Clean up watchers when window closes
    mainWindow.on('closed', () => {
      if (reloadTimer) clearTimeout(reloadTimer);
    });
  }
}

function isConfigured(cfg) {
  return !!cfg?.installed;
}

async function runBackendStack(config, secrets = {}) {
  const normalized = normalizeConfig(config);
  await backendService.ensureConfig(CONFIG_PATH, normalized);
  const appInstance = await backendService.startBackend({
    configPath: CONFIG_PATH,
    port: normalized.serverPort,
    dataRoot: normalized.dataRoot,
  });
  const conn = appInstance.db && appInstance.db.conn;
  if (conn && conn.db) {
    await migrationsService.runMigrations({
      db: conn.db,
      client: conn.client,
    });
  }
  await setupService.ensureCore(appInstance, config, secrets);
  return appInstance;
}

async function showWizard() {
  wizardWindow = new BrowserWindow({
    width: 900,
    height: 800,
    resizable: true,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable DevTools in development mode only
      devTools: isDev,
    },
  });
  wizardWindow.removeMenu();
  lockNavigation(wizardWindow, [`file://${path.join(__dirname, 'wizard')}`]);
  wizardWindow.loadURL(`file://${path.join(__dirname, 'wizard', 'index.html')}`);
  
  // Automatically open DevTools in development mode for wizard window too
  if (isDev) {
    wizardWindow.webContents.openDevTools();
  }

  wizardWindow.on('closed', () => {
    wizardWindow = null;
  });
}

// Removed - replaced by installation service

async function bootstrap() {
  try {
    await mongodbService.startMongo();
  } catch (err) {
    console.error('Failed to start MongoDB:', err);
    // Show error dialog instead of crashing
    const { dialog } = require('electron');
    const mongoService = require('./services/mongodb');
    const mongoPath = mongoService.getMongoBinaryPath();
    dialog.showErrorBox('MongoDB Startup Error', 
      `Failed to start MongoDB: ${err.message}\n\n` +
      `Please ensure MongoDB binary exists at:\n${mongoPath}`);
    app.quit();
    return;
  }
  const config = await loadConfig();
  if (!isConfigured(config)) {
    await showWizard();
    return;
  }
  await runBackendStack(config);
  await createWindow(config.serverPort);
}

// Get framework version for wizard
ipcMain.handle('wizard:getFrameworkVersion', async () => {
  try {
    return await new Promise((resolve, reject) => {
      installHelpers.getLatestFrameworkVersion((err, version) => {
        if (err) {
          // Fallback to latest tag
          resolve('tags/latest');
        } else {
          resolve(version);
        }
      });
    });
  } catch (err) {
    return 'tags/latest';
  }
});

// Test SMTP connection
ipcMain.handle('wizard:testSmtp', async (event, smtpConfig) => {
  try {
    return await smtpService.testSmtpConnection(smtpConfig);
  } catch (err) {
    return {
      success: false,
      error: err.message || 'SMTP test failed',
    };
  }
});

// Start installation process
ipcMain.handle('wizard:startInstallation', async (event, config) => {
  try {
    // Create progress callback that sends updates to renderer
    const progressCallback = (progress) => {
      if (wizardWindow && !wizardWindow.isDestroyed()) {
        wizardWindow.webContents.send('installation:progress', progress);
      }
    };

    const result = await installationService.runInstallation(config, progressCallback);
    
    if (result.success) {
      const installedConfig = await loadConfig();
      if (wizardWindow) {
        wizardWindow.close();
        wizardWindow = null;
      }
      await createWindow(installedConfig.serverPort);
      return result;
    } else {
      throw new Error(result.error || 'Installation failed');
    }
  } catch (err) {
    console.error('Installation failed', err);
    return {
      success: false,
      error: err.message || 'Installation failed',
    };
  }
});

// Launch main application after installation
ipcMain.handle('wizard:launchApp', async () => {
  try {
    const config = await loadConfig();
    if (!isConfigured(config)) {
      throw new Error('Configuration not found');
    }

    // Close wizard window
    if (wizardWindow) {
      wizardWindow.close();
      wizardWindow = null;
    }

    // Start backend and open main window
    await runBackendStack(config);
    await createWindow(config.serverPort);
    
    return { success: true };
  } catch (err) {
    console.error('Failed to launch app', err);
    return {
      success: false,
      error: err.message || 'Failed to launch application',
    };
  }
});

app.whenReady().then(bootstrap).catch(err => {
  console.error('Failed to start application', err);
  const { dialog } = require('electron');
  dialog.showErrorBox('Application Error', `Failed to start: ${err.message}`);
  app.quit();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('quit', () => {
  backendService.stopBackend();
  mongodbService.stopMongo();
});


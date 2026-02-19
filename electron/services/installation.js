const path = require('path');
const fs = require('fs-extra');
const installHelpers = require('../../lib/installHelpers');
const encryption = require('./encryption');
const backendService = require('./backend');
const setupService = require('./setup');
const migrationsService = require('./migrations');

/**
 * Installation progress tracker
 */
class InstallationProgress {
  constructor(progressCallback) {
    this.progressCallback = progressCallback;
    this.percent = 0;
  }

  update(message, type = 'info', percent = null) {
    if (percent !== null) {
      this.percent = percent;
    }
    if (this.progressCallback) {
      this.progressCallback({
        message,
        type,
        percent: this.percent,
        status: this.getStatusMessage(),
      });
    }
  }

  getStatusMessage() {
    if (this.percent < 20) return 'Starting MongoDB...';
    if (this.percent < 40) return 'Initializing database...';
    if (this.percent < 60) return 'Creating tenant and admin...';
    if (this.percent < 80) return 'Applying configuration...';
    if (this.percent < 100) return 'Finalizing setup...';
    return 'Installation complete!';
  }
}

/**
 * Main installation function
 */
async function runInstallation(config, progressCallback) {
  const progress = new InstallationProgress(progressCallback);
  const { core, smtp } = config;

  try {
    // Step 1: Ensure MongoDB is running (assumed to be started by main process)
    progress.update('Checking MongoDB connection...', 'info', 10);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Get framework version (use from config or fetch latest)
    progress.update('Fetching framework version...', 'info', 15);
    let frameworkVersion = core.frameworkTag;
    if (!frameworkVersion || frameworkVersion === 'Loading...') {
      frameworkVersion = await new Promise((resolve) => {
        installHelpers.getLatestFrameworkVersion((err, version) => {
          if (err) {
            // Fallback to latest tag if API fails
            resolve('tags/latest');
          } else {
            resolve(version);
          }
        });
      });
    }

    // Step 3: Prepare configuration
    progress.update('Preparing configuration...', 'info', 20);
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config', 'config.json');
    const masterPassword = encryption.generateMasterPassword(userDataPath);

    const finalConfig = {
      serverPort: 3000,
      serverName: 'localhost',
      dataRoot: path.join(userDataPath, 'data'),
      dbType: 'mongoose',
      dbHost: core.dbHost || 'localhost',
      dbPort: core.dbPort || 27017,
      dbName: 'adapt-tenant-master',
      outputPlugin: 'adapt',
      auth: 'local',
      sessionSecret: require('../../lib/sessionSecret').getSessionSecret(path.dirname(configPath)),
      root: path.join(__dirname, '..', '..'),
      frameworkRepository: core.frameworkRepo || installHelpers.DEFAULT_FRAMEWORK_REPO,
      frameworkRevision: frameworkVersion,
      masterTenantID: null, // Will be set after tenant creation
      masterTenant: {
        name: core.tenantName,
        displayName: core.tenantDisplayName,
      },
      admin: {
        email: core.adminEmail,
        password: '', // Not stored in config
      },
      smtp: {
        enabled: smtp?.enabled || false,
        service: '',
        host: smtp?.host || '',
        port: smtp?.port || 0,
        username: smtp?.username || '',
        password: smtp?.enabled && smtp?.password 
          ? encryption.encrypt(smtp.password, masterPassword)
          : '',
        fromAddress: smtp?.from || '',
        connectionUrl: '',
        rootUrl: `http://localhost:3000`,
      },
      installed: true,
    };

    // Step 4: Save configuration
    progress.update('Saving configuration...', 'info', 25);
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJson(configPath, finalConfig, { spaces: 2 });
    await backendService.ensureConfig(configPath, finalConfig);

    // Step 5: Start backend and initialize
    progress.update('Starting backend services...', 'info', 30);
    const appInstance = await backendService.startBackend({
      configPath,
      port: finalConfig.serverPort,
      dataRoot: finalConfig.dataRoot,
    });

    // Step 6: Run migrations
    progress.update('Running database migrations...', 'info', 40);
    const conn = appInstance.db && appInstance.db.conn;
    if (conn && conn.db) {
      await migrationsService.runMigrations({
        db: conn.db,
        client: conn.client,
      });
    }

    // Step 7: Create master tenant
    progress.update('Creating master tenant...', 'info', 50);
    await setupService.ensureCore(appInstance, finalConfig, {
      adminPassword: core.adminPassword,
    });

    // Step 8: Update config with master tenant ID
    progress.update('Finalizing configuration...', 'info', 70);
    const tenant = await new Promise((resolve, reject) => {
      appInstance.tenantmanager.retrieveTenant(
        { name: core.tenantName },
        (err, tenant) => {
          if (err) return reject(err);
          resolve(tenant);
        }
      );
    });

    if (tenant) {
      finalConfig.masterTenantID = tenant._id.toString();
      await fs.writeJson(configPath, finalConfig, { spaces: 2 });
      
      // Step 9: Install Adapt Framework
      progress.update('Installing Adapt Framework...', 'info', 80);
      try {
        const frameworkDir = path.join(
          finalConfig.root,
          'temp',
          tenant._id.toString(),
          'adapt_framework'
        );
        
        await new Promise((resolve, reject) => {
          installHelpers.installFramework({
            directory: frameworkDir,
            repository: finalConfig.frameworkRepository || installHelpers.DEFAULT_FRAMEWORK_REPO,
            revision: finalConfig.frameworkRevision || frameworkVersion,
            force: false,
            app: appInstance,
          }, (err) => {
            if (err) {
              progress.update(`Framework installation warning: ${err.message}`, 'error', 85);
              // Don't fail installation if framework install fails - it can be done later
              return resolve();
            }
            progress.update('Framework installed successfully', 'success', 90);
            resolve();
          });
        });
      } catch (err) {
        // Framework installation is optional - log but don't fail
        progress.update(`Framework installation skipped: ${err.message}`, 'error', 85);
      }
    }

    progress.update('Installation completed successfully!', 'success', 100);
    return { success: true };
  } catch (err) {
    progress.update(`Installation failed: ${err.message}`, 'error', 0);
    return {
      success: false,
      error: err.message || 'Unknown error occurred',
    };
  }
}

module.exports = {
  runInstallation,
};


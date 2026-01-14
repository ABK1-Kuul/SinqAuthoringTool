#!/usr/bin/env node
/**
 * Install Adapt Framework for existing installation
 * Usage: node scripts/get-framework.js
 */

const path = require('path');
const fs = require('fs-extra');
const installHelpers = require('../lib/installHelpers');
const configuration = require('../lib/configuration');
const database = require('../lib/database');

// Try to get config path - works in both Electron and Node contexts
function getConfigPath() {
  // Try Electron userData path first
  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      const electronPath = path.join(app.getPath('userData'), 'config', 'config.json');
      if (fs.existsSync(electronPath)) {
        return electronPath;
      }
    }
  } catch (e) {
    // Not in Electron context, continue
  }
  
  // Try Windows AppData path (where Electron stores userData)
  const appDataPath = path.join(
    process.env.APPDATA || process.env.HOME || process.cwd(),
    'SINQ_authoring',
    'config',
    'config.json'
  );
  if (fs.existsSync(appDataPath)) {
    return appDataPath;
  }
  
  // Fallback to project conf
  const projectConf = path.join(__dirname, '..', 'conf', 'config.json');
  if (fs.existsSync(projectConf)) {
    return projectConf;
  }
  
  return path.join(process.cwd(), 'userData', 'config', 'config.json');
}

async function installFramework() {
  try {
    console.log('=== Adapt Framework Installation ===\n');
    
    const configPath = getConfigPath();
    console.log(`Loading config from: ${configPath}`);
    
    if (!await fs.pathExists(configPath)) {
      throw new Error(`Config file not found: ${configPath}\nPlease run the setup wizard first.`);
    }
    
    const config = await fs.readJson(configPath);
    
    // Initialize configuration
    console.log('Initializing configuration...');
    const appConfig = configuration;
    await new Promise((resolve, reject) => {
      appConfig.load(configPath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Get master tenant ID from config or database
    let masterTenantID = config.masterTenantID;
    
    if (!masterTenantID) {
      console.log('Master tenant ID not in config, querying database...');
      
      // Get database connection using the database name from config
      const dbName = config.dbName || 'adapt-tenant-master';
      const db = await new Promise((resolve, reject) => {
        database.getDatabase((err, dbInstance) => {
          if (err) return reject(err);
          resolve(dbInstance);
        }, dbName);
      });

      // Find master tenant
      const Tenant = db.getModel('tenant');
      const tenant = await new Promise((resolve, reject) => {
        Tenant.findOne({ isMaster: true }, (err, tenant) => {
          if (err) return reject(err);
          if (!tenant) return reject(new Error('Master tenant not found. Please run setup first.'));
          resolve(tenant);
        });
      });

      masterTenantID = tenant._id.toString();
      console.log(`Found master tenant: ${tenant.name} (ID: ${masterTenantID})`);
      
      // Update config
      config.masterTenantID = masterTenantID;
      await fs.writeJson(configPath, config, { spaces: 2 });
      appConfig.setConfig('masterTenantID', masterTenantID);
    } else {
      console.log(`Using master tenant ID from config: ${masterTenantID}`);
    }

    // Get framework version
    console.log('\nFetching latest framework version...');
    const frameworkVersion = await new Promise((resolve, reject) => {
      installHelpers.getLatestFrameworkVersion((err, version) => {
        if (err) {
          console.warn(`Warning: Could not fetch latest version: ${err.message}`);
          console.log('Using default: tags/v5.55.1');
          return resolve('tags/v5.55.1');
        }
        resolve(version);
      });
    });

    console.log(`Framework version: ${frameworkVersion}`);

    // Determine framework directory
    const frameworkDir = path.join(
      appConfig.serverRoot,
      'temp',
      masterTenantID,
      'adapt_framework'
    );

    console.log(`\nInstalling framework to: ${frameworkDir}`);
    console.log('This may take a few minutes...\n');

    // Install framework
    await new Promise((resolve, reject) => {
      installHelpers.installFramework({
        directory: frameworkDir,
        repository: config.frameworkRepository || installHelpers.DEFAULT_FRAMEWORK_REPO,
        revision: config.frameworkRevision || frameworkVersion,
        force: false
      }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('\n✓ Framework installed successfully!');
    console.log(`  Location: ${frameworkDir}`);
    console.log(`  Version: ${frameworkVersion}`);
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Error installing framework:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  installFramework();
}

module.exports = { installFramework };


const path = require('path');
const fs = require('fs-extra');
const installHelpers = require('../lib/installHelpers');
const configuration = require('../lib/configuration');
const database = require('../lib/database');

// Get config path
const { app } = require('electron');
const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), 'userData');
const configPath = path.join(userDataPath, 'config', 'config.json');

async function installFramework() {
  try {
    console.log('Loading configuration...');
    const config = await fs.readJson(configPath);
    
    // Initialize configuration
    const appConfig = new configuration.Configuration();
    await new Promise((resolve, reject) => {
      appConfig.load(configPath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Get database connection to find master tenant
    console.log('Connecting to database...');
    const db = await new Promise((resolve, reject) => {
      database.getDatabase((err, dbInstance) => {
        if (err) return reject(err);
        resolve(dbInstance);
      });
    });

    // Find master tenant
    console.log('Finding master tenant...');
    const Tenant = db.getModel('tenant');
    const tenant = await new Promise((resolve, reject) => {
      Tenant.findOne({ isMaster: true }, (err, tenant) => {
        if (err) return reject(err);
        if (!tenant) return reject(new Error('Master tenant not found'));
        resolve(tenant);
      });
    });

    console.log(`Found master tenant: ${tenant.name} (ID: ${tenant._id})`);

    // Update config with master tenant ID
    config.masterTenantID = tenant._id.toString();
    await fs.writeJson(configPath, config, { spaces: 2 });
    appConfig.setConfig('masterTenantID', tenant._id.toString());

    // Get latest framework version
    console.log('Fetching latest framework version...');
    const frameworkVersion = await new Promise((resolve, reject) => {
      installHelpers.getLatestFrameworkVersion((err, version) => {
        if (err) return reject(err);
        resolve(version);
      });
    });

    console.log(`Latest framework version: ${frameworkVersion}`);

    // Determine framework directory
    const frameworkDir = path.join(
      appConfig.serverRoot,
      'temp',
      tenant._id.toString(),
      'adapt_framework'
    );

    console.log(`Installing framework to: ${frameworkDir}`);

    // Install framework
    await new Promise((resolve, reject) => {
      installHelpers.installFramework({
        directory: frameworkDir,
        repository: installHelpers.DEFAULT_FRAMEWORK_REPO,
        revision: frameworkVersion,
        force: false
      }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('Framework installed successfully!');
    console.log(`Location: ${frameworkDir}`);
    process.exit(0);
  } catch (err) {
    console.error('Error installing framework:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  installFramework();
}

module.exports = { installFramework };


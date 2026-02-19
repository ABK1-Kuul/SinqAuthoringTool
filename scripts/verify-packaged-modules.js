const fs = require('fs');
const path = require('path');

// Critical modules that must be present in the packaged app
const CRITICAL_MODULES = [
  // Bower and its dependencies
  'bower',
  'bower-config',
  'bower-logger',
  'mout',
  'q',
  'configstore',
  // Configstore dependencies
  'dot-prop',
  'graceful-fs',
  'make-dir',
  'unique-string',
  'write-file-atomic',
  'xdg-basedir',
  // Core application dependencies
  'fs-extra',
  'express',
  'mongoose',
  'async',
  'underscore',
  'axios',
  'bcrypt',
];

function verifyPackagedModules(appPath) {
  const nodeModulesPath = path.join(appPath, 'resources', 'app', 'node_modules');
  const missing = [];
  const found = [];

  console.log('Verifying packaged modules...\n');
  console.log(`Checking: ${nodeModulesPath}\n`);

  CRITICAL_MODULES.forEach(moduleName => {
    const modulePath = path.join(nodeModulesPath, moduleName);
    if (fs.existsSync(modulePath)) {
      found.push(moduleName);
      console.log(`âœ“ ${moduleName}`);
    } else {
      missing.push(moduleName);
      console.log(`âœ— ${moduleName} - MISSING`);
    }
  });

  console.log(`\n--- Summary ---`);
  console.log(`Found: ${found.length}/${CRITICAL_MODULES.length}`);
  console.log(`Missing: ${missing.length}/${CRITICAL_MODULES.length}`);

  if (missing.length > 0) {
    console.log(`\nâŒ Missing modules: ${missing.join(', ')}`);
    process.exit(1);
  } else {
    console.log(`\nâœ… All critical modules are present!`);
    process.exit(0);
  }
}

// Get app path from command line or use default
const appPath = process.argv[2] || path.join(__dirname, '..', 'dist', 'win-unpacked');

if (!fs.existsSync(appPath)) {
  console.error(`Error: App path does not exist: ${appPath}`);
  console.error('Usage: node verify-packaged-modules.js [path-to-unpacked-app]');
  process.exit(1);
}

verifyPackagedModules(appPath);

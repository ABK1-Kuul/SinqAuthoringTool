#!/usr/bin/env node
/**
 * Simple script to install Adapt Framework using git
 * Usage: node scripts/get-framework-simple.js [tenant-id] [version]
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

const FRAMEWORK_REPO = 'https://github.com/adaptlearning/adapt_framework.git';
const DEFAULT_VERSION = 'v5.55.1';

async function installFramework() {
  try {
    const tenantId = process.argv[2];
    const version = process.argv[3] || DEFAULT_VERSION;
    
    if (!tenantId) {
      // Try to read from config
      const configPaths = [
        path.join(process.env.APPDATA || '', 'SINQ_authoring', 'config', 'config.json'),
        path.join(__dirname, '..', 'conf', 'config.json'),
      ];
      
      let config;
      for (const configPath of configPaths) {
        if (await fs.pathExists(configPath)) {
          config = await fs.readJson(configPath);
          break;
        }
      }
      
      if (!config || !config.masterTenantID) {
        console.error('Error: Master tenant ID required.');
        console.error('Usage: node scripts/get-framework-simple.js <tenant-id> [version]');
        console.error('\nOr ensure config.json has masterTenantID set.');
        process.exit(1);
      }
      
      const finalTenantId = config.masterTenantID;
      const finalVersion = config.frameworkRevision || version;
      
      return installToTenant(finalTenantId, finalVersion);
    }
    
    return installToTenant(tenantId, version);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

async function installToTenant(tenantId, version) {
  const frameworkDir = path.join(
    __dirname,
    '..',
    'temp',
    tenantId,
    'adapt_framework'
  );
  
  console.log('=== Adapt Framework Installation ===\n');
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`Version: ${version}`);
  console.log(`Directory: ${frameworkDir}\n`);
  
  const versionTag = version.startsWith('tags/') ? version : `tags/${version}`;
  
  if (await fs.pathExists(frameworkDir)) {
    console.log('Framework directory exists, updating...');
    try {
      process.chdir(frameworkDir);
      execSync('git fetch origin', { stdio: 'inherit' });
      execSync(`git checkout ${versionTag}`, { stdio: 'inherit' });
      execSync('git reset --hard', { stdio: 'inherit' });
      console.log('\n✓ Framework updated successfully!');
    } catch (err) {
      console.error('Update failed, cloning fresh...');
      await fs.remove(frameworkDir);
      return cloneFresh(frameworkDir, versionTag);
    }
  } else {
    return cloneFresh(frameworkDir, versionTag);
  }
}

async function cloneFresh(frameworkDir, versionTag) {
  console.log('Cloning framework repository...');
  console.log('This may take a few minutes...\n');
  
  await fs.ensureDir(path.dirname(frameworkDir));
  
  try {
    execSync(`git clone ${FRAMEWORK_REPO} "${frameworkDir}"`, { stdio: 'inherit' });
    process.chdir(frameworkDir);
    execSync(`git checkout ${versionTag}`, { stdio: 'inherit' });
    console.log('\n✓ Framework installed successfully!');
    console.log(`  Location: ${frameworkDir}`);
    console.log(`  Version: ${versionTag}`);
  } catch (err) {
    console.error('\n✗ Error cloning framework:', err.message);
    process.exit(1);
  }
}

installFramework();


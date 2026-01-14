# Initial Setup Guide for SINQ Authoring Tool

This document lists all prerequisites and setup steps required before running the project.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup Steps](#project-setup-steps)
4. [Configuration Details](#configuration-details)
5. [Post-Installation Verification](#post-installation-verification)

---

## System Requirements

### Required Software

1. **Node.js**
   - Version: **16.x or 18.x** (as specified in `package.json` engines)
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verify installation: `node --version`

2. **MongoDB**
   - Version: Community Server (latest stable recommended)
   - Must be installed and running before installation
   - Default port: `27017`
   - Download: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Verify installation: `mongod --version`
   - Verify running: `mongosh` or check service status

3. **Git**
   - Required for cloning the Adapt Framework repository during installation
   - Download: [https://git-scm.com/downloads](https://git-scm.com/downloads)
   - Verify installation: `git --version`

4. **Internet Connection**
   - Required for:
     - Installing npm packages
     - Cloning Adapt Framework from GitHub
     - Checking latest framework versions via GitHub API
     - Installing framework plugins via Bower

### Optional but Recommended

- **Grunt CLI** (globally installed)
  - Install: `npm install -g grunt-cli`
  - Verify: `grunt --version`
  - Note: Can use `npx grunt` instead if not installed globally

---

## Prerequisites Installation

### Step 1: Install Node.js

1. Download Node.js 16.x or 18.x LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the prompts
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install MongoDB

1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install MongoDB following the installation wizard
3. Start MongoDB service:
   - **Windows**: MongoDB should start as a service automatically, or run `net start MongoDB`
   - **Linux/Mac**: `sudo systemctl start mongod` or `brew services start mongodb-community`
4. Verify MongoDB is running:
   ```bash
   mongosh
   # or
   mongo
   ```
   If connection succeeds, MongoDB is running correctly.

### Step 3: Install Git

1. Download Git from [git-scm.com](https://git-scm.com/downloads)
2. Install using default settings
3. Verify installation:
   ```bash
   git --version
   ```

### Step 4: (Optional) Install Grunt CLI Globally

```bash
npm install -g grunt-cli
```

---

## Project Setup Steps

### Step 1: Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd adapt_authoring-1
```

Or extract the project ZIP file to your desired location.

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`, including:
- Express.js (web server)
- Mongoose (MongoDB ODM)
- Grunt and build tools
- Bower (for framework plugin management)
- All other npm packages

**Expected time**: 2-5 minutes depending on internet speed

### Step 3: Run the Installation Script

```bash
node install.js
```

The installation script will:

1. **Check Prerequisites**
   - Verify Node.js version
   - Verify Git is installed
   - Test GitHub API connection
   - Test MongoDB connection (if configured)

2. **Configure Server Settings** (interactive prompts)
   - Server port (default: `5000`)
   - Server name (default: `localhost`)
   - Data directory path (default: `data`)
   - Authoring tool repository URL
   - Framework repository URL
   - Framework revision/tag to use

3. **Configure Database Connection** (interactive prompts)
   - Database name (default: `adapt-tenant-master`)
   - Connection method: Full URI or standard connection
   - If standard:
     - Database host (default: `localhost`)
     - Database port (default: `27017`)
     - Database user (if using authentication)
     - Database password (if using authentication)
     - Authentication database (if using authentication)

4. **Configure SMTP (Optional)** (interactive prompts)
   - Use SMTP server? (for sending emails)
   - If yes:
     - Connection URL or service configuration
     - SMTP service type (Gmail, Outlook, custom, etc.)
     - SMTP username and password
     - Sender email address
     - Root URL for email links

5. **Configure Master Tenant** (interactive prompts)
   - Tenant name (default: `master`)
   - Tenant display name (default: `Master`)

6. **Create Super Admin User** (interactive prompts)
   - Email address (required)
   - Password (required)
   - Confirm password (required)

7. **Build Frontend Application**
   - Runs `grunt build:prod` to compile:
     - Less files to CSS
     - Handlebars templates
     - RequireJS modules
     - Babel transpilation

8. **Run Database Migrations**
   - Executes migration scripts to set up database schema

### Step 4: Verify Installation

After installation completes, you should see:
```
Installation completed, the application can now be started with 'node server'.
```

---

## Configuration Details

### Configuration File Location

The installation creates `conf/config.json` with all settings. This file contains:

```json
{
  "serverPort": 5000,
  "serverName": "localhost",
  "dataRoot": "data",
  "dbType": "mongoose",
  "dbHost": "localhost",
  "dbPort": 27017,
  "dbName": "adapt-tenant-master",
  "sessionSecret": "<auto-generated>",
  "rootUrl": "http://localhost:5000",
  "outputPlugin": "adapt",
  "auth": "local",
  "root": "<project-root-path>",
  "masterTenantID": "<tenant-id>",
  // ... SMTP settings if configured
}
```

### Important Configuration Values

- **`serverPort`**: Port the web server listens on (default: `5000`)
- **`dbHost`**: MongoDB host (default: `localhost`)
- **`dbPort`**: MongoDB port (default: `27017`)
- **`dbName`**: Master database name
- **`dataRoot`**: Directory for storing course data, uploads, exports
- **`sessionSecret`**: Auto-generated secret for session encryption
- **`masterTenantID`**: Auto-generated ID for the master tenant

### Manual Configuration (Alternative)

If you prefer to configure manually:

1. Create `conf/config.json` with required settings
2. Run: `node install.js --useJSON`
3. The script will use values from `config.json` instead of prompting

---

## Post-Installation Verification

### Step 1: Start the Server

```bash
node server.js
```

Or:
```bash
node server
```

### Step 2: Verify Server is Running

1. Check console output for:
   ```
   Listening on http://localhost:5000
   ```

2. Open browser and navigate to:
   ```
   http://localhost:5000
   ```

3. You should see the login page

### Step 3: Test Login

1. Use the Super Admin credentials created during installation
2. Log in successfully
3. Verify you can access the dashboard

### Step 4: Verify Database

1. Connect to MongoDB:
   ```bash
   mongosh
   ```

2. List databases:
   ```javascript
   show dbs
   ```

3. Use your database:
   ```javascript
   use adapt-tenant-master
   ```

4. Verify collections exist:
   ```javascript
   show collections
   ```

   Should include: `users`, `tenants`, `courses`, etc.

---

## Troubleshooting Common Issues

### Issue: Node.js Version Mismatch

**Error**: "You are using Node.js X which is not supported"

**Solution**: Install Node.js 16.x or 18.x LTS

### Issue: MongoDB Connection Failed

**Error**: "Couldn't connect to the database"

**Solutions**:
1. Verify MongoDB service is running
2. Check `dbHost` and `dbPort` in configuration
3. Verify MongoDB is accessible: `mongosh --host localhost --port 27017`
4. Check firewall settings

### Issue: Git Not Found

**Error**: "git could not be found"

**Solution**: Install Git and ensure it's in your system PATH

### Issue: GitHub API Connection Failed

**Error**: "Failed to connect to https://api.github.com/"

**Solutions**:
1. Check internet connection
2. Verify GitHub is accessible
3. If behind a proxy, configure Git proxy settings
4. Check firewall/proxy settings

### Issue: Frontend Build Failed

**Error**: "Failed to build the web application"

**Solutions**:
1. Manually run: `npx grunt build:prod`
2. Check for missing dependencies: `npm install`
3. Verify Grunt is accessible: `npx grunt --version`

### Issue: Port Already in Use

**Error**: "Port X already in use"

**Solutions**:
1. Change `serverPort` in `conf/config.json`
2. Stop the process using the port
3. Use a different port when starting: `node server.js --port 3000`

### Issue: Missing Dependencies

**Error**: Module not found errors

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

---

## Quick Start Summary

For experienced users, here's the condensed setup:

```bash
# 1. Ensure prerequisites are installed
node --version    # Should be 16.x or 18.x
mongod --version  # MongoDB should be installed
git --version     # Git should be installed

# 2. Install dependencies
npm install

# 3. Run installation (interactive)
node install.js

# 4. Start server
node server.js
```

---

## Next Steps

After successful installation:

1. **Access the Application**: Open `http://localhost:5000` in your browser
2. **Log In**: Use the Super Admin credentials created during installation
3. **Create Your First Course**: Follow the on-screen instructions
4. **Configure Additional Settings**: Access settings from the admin panel
5. **Read Documentation**: Visit the [wiki](https://github.com/adaptlearning/adapt_authoring/wiki) for detailed guides

---

## Additional Resources

- [Installation Wiki](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-the-Authoring-Tool)
- [Technical Forum](https://community.adaptlearning.org/mod/forum/view.php?id=4)
- [GitHub Issues](https://github.com/adaptlearning/adapt_authoring/issues)

---

**Note**: This setup guide covers the initial installation. For production deployments, additional considerations such as security, performance tuning, and backup strategies should be implemented.


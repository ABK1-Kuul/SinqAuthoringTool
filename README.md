# SINQ Authoring Tool

<div align="center">

**A Portable Desktop Application for eLearning Course Authoring**

Built on top of [Adapt Authoring Tool](https://github.com/adaptlearning/adapt_authoring) | Powered by [Adapt Framework](https://github.com/adaptlearning/adapt_framework)

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)](https://www.microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Electron-24.8.6-47848F.svg)](https://www.electronjs.org/)

</div>

---

## 🎯 Overview

**SINQ Authoring Tool** is a standalone, portable desktop application that brings the power of Adapt Framework course authoring to your Windows PC. No server setup, no database installation, no command-line configuration—everything runs locally with a beautiful GUI setup wizard.

This project transforms the web-based Adapt Authoring Tool into a true desktop application, making eLearning course creation accessible to non-technical users while maintaining all the powerful features of the original Adapt ecosystem.

## ✨ Key Features

### 🖥️ **True Desktop Application**
- Runs entirely within Electron—no browser required
- Native Windows application experience
- Single executable, fully portable
- No external dependencies or installations needed

### 🗄️ **Embedded Services**
- **MongoDB** bundled and managed automatically
- **Backend server** runs invisibly in the background
- All data stored locally in the application folder
- Fully offline-capable after initial setup

### 🎨 **User-Friendly Setup**
- **Multi-page GUI wizard** guides you through setup
- **Auto-filled defaults** for quick configuration
- **SMTP testing** built-in for email notifications
- **Progress tracking** with friendly status messages
- **No CLI knowledge required**

### 🔒 **Security & Privacy**
- **Encrypted SMTP credentials** stored securely
- **Local data storage**—your courses stay on your machine
- **Context isolation** and secure IPC communication
- **Production-ready** security hardening

### 📦 **Portable & Self-Contained**
- Everything bundled in one folder
- No registry entries or system modifications
- Easy to backup, move, or deploy
- Perfect for organizations with strict IT policies

## 🚀 Quick Start

### For End Users

1. **Download** the portable Windows executable
2. **Run** the application
3. **Follow** the setup wizard (takes ~5 minutes)
4. **Start creating** your eLearning courses!

### Setup Wizard Flow

1. **Welcome** - Overview of required information
2. **Core Configuration** - Tenant and admin account setup
3. **SMTP (Optional)** - Email notification configuration
4. **Review & Confirm** - Verify your settings
5. **Installation** - Automatic setup with progress tracking
6. **Finish** - Launch and start authoring!

### System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB for application + space for courses
- **Internet**: Required only for initial framework download

## 📋 What You'll Need

### Required (Always Manual)
- Tenant unique name (lowercase, alphanumeric)
- Tenant display name
- Admin email address
- Admin password

### Optional
- SMTP configuration for email notifications
  - SMTP host, port, username, password
  - Sender email address

### Auto-Configured (Editable)
- MongoDB host: `localhost`
- MongoDB port: `27017`
- Database authentication: Disabled
- Framework repository: Stable Adapt Framework
- Data directory: Local app folder

## 🏗️ Architecture

```
SINQ Authoring Tool
├── Electron Main Process
│   ├── MongoDB Service (Embedded)
│   ├── Backend Service (Node.js)
│   ├── Configuration Management
│   └── Window Management
├── Electron Renderer
│   ├── Setup Wizard UI
│   └── Adapt Authoring Tool UI
└── Data Storage
    ├── MongoDB Data
    ├── Course Files
    └── Configuration
```

## 🛠️ Development

### Prerequisites

- Node.js 16.x or 18.x
- Git
- Windows 10/11

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd adapt_authoring-1

# Install dependencies
npm install

# Build frontend
npm run build:frontend

# Run in development mode
npm run dev
```

### Building

```bash
# Build portable Windows executable
npm run build:electron:win
```

The output will be in the `dist` folder.

## 📁 Project Structure

```
adapt_authoring-1/
├── electron/              # Electron application code
│   ├── main.js           # Main process entry point
│   ├── preload.js        # Secure IPC bridge
│   ├── services/         # Service modules
│   │   ├── mongodb.js    # MongoDB management
│   │   ├── backend.js    # Backend service
│   │   ├── installation.js # Setup wizard logic
│   │   └── encryption.js # SMTP password encryption
│   └── wizard/           # Setup wizard UI
│       └── index.html    # Multi-page wizard
├── lib/                  # Backend libraries
├── frontend/             # Adapt Authoring Tool UI
├── resources/            # Bundled resources
│   └── mongodb/          # MongoDB binaries
└── scripts/              # Utility scripts
```

## 🔧 Configuration

Configuration is stored in:
- **Windows**: `%APPDATA%\SINQ_authoring\config\config.json`
- **Development**: `userData\config\config.json`

The configuration file includes:
- Database settings
- Tenant information
- Admin credentials (password not stored)
- SMTP settings (encrypted)
- Framework version

## 🐛 Troubleshooting

### MongoDB Won't Start
- Check if port 27017 is already in use
- Ensure MongoDB binaries exist in `resources/mongodb/bin/`
- Check logs in `userData/mongodb/mongod.log`

### Backend Connection Errors
- Verify MongoDB is running on port 27017
- Check backend logs in the console
- Ensure configuration file exists and is valid

### Framework Not Found
- Run the framework installation script:
  ```bash
  node scripts/get-framework-simple.js <tenant-id>
  ```
- Or re-run the setup wizard

## 📝 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

SINQ Authoring Tool is built on top of:
- [Adapt Authoring Tool](https://github.com/adaptlearning/adapt_authoring) - GPL-3.0
- [Adapt Framework](https://github.com/adaptlearning/adapt_framework) - GPL-3.0

## 🙏 Acknowledgments

- **Adapt Learning** - For the excellent Adapt Framework and Authoring Tool
- **Electron** - For enabling cross-platform desktop applications
- **MongoDB** - For the embedded database solution

## 📞 Support & Contact

⚠️ **Preview Repository Notice**

This repository provides a preview of the project's capabilities. 

**For the full end-to-end solution and dedicated support, please contact the developer.**

---

<div align="center">

**Built with ❤️ for the eLearning community**

[Report Issue](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues) · [View Documentation](https://github.com/adaptlearning/adapt_authoring/wiki)

</div>

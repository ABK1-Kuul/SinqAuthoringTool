<div align="center">
  <img src="frontend/src/core/assets/adapt-learning-logo-white.png" alt="SINQ Authoring Tool Logo" width="250" />
</div>

# SINQ Authoring Tool

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Release](https://img.shields.io/github/v/release/ABK1-Kuul/SinqAuthoringTool)](https://github.com/ABK1-Kuul/SinqAuthoringTool/releases/latest)
[![Build Status](https://github.com/ABK1-Kuul/SinqAuthoringTool/actions/workflows/build.yml/badge.svg)](https://github.com/ABK1-Kuul/SinqAuthoringTool/actions/workflows/build.yml)

**The definitive desktop distribution of the Adapt Authoring Tool. Built for stability, security, and zero-config deployment.**

[Visit the Official Website](https://sinq-authoring.vercel.app)

---

## Why SINQ?

Adapt is powerful but notoriously difficult to install. SINQ packages the entire stack—Node.js, MongoDB, and the Authoring Engine—into a single, portable Windows executable.

No servers. No database setup. No command-line configuration. Download, run, and start authoring.

---

## Key Modernizations

The following improvements were made during our production readiness audit:

- **Hardened Security** — Strict CSP (Content Security Policy) and context isolation. Navigation locking and URL allowlisting prevent injection and unauthorized navigation.

- **Modern Stack** — Node 18+ compatible (Node 20 LTS recommended), Axios, and Bcrypt. Dependencies updated for security and compatibility.

- **Automated Lifecycle** — No manual MongoDB setup required. The embedded database initializes automatically on first run.

- **Pre-flight Diagnostics** — Integrated environment verification. Clear error messages when prerequisites are missing.

- **Rich Text & Asset Integration** — Configured Content Security Policy (CSP) to seamlessly support `unsafe-eval` for underscore.js templates and external assets like CKEditor (`cdn.ckeditor.com`) without compromising overall electron security.

---

## Quick Start for Developers

**Prerequisites**: Ensure you have Node.js (>= 18) and a local MongoDB instance available (default port `27017`).

```bash
# Clone the repository
git clone https://github.com/ABK1-Kuul/SinqAuthoringTool.git
cd SinqAuthoringTool

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will automatically start the server on `http://localhost:3000` and open the Electron interface. We use **cross-env** for seamless development across Windows and Unix. The same commands work everywhere.

---

## Documentation & Support

For deep technical dives, visit our official website:

- [Architecture](https://sinq-authoring.vercel.app/architecture) — System design, layers, and production readiness pillars
- [Documentation](https://sinq-authoring.vercel.app/docs) — Installation, troubleshooting, and plugin guide

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

SINQ Authoring Tool is built on top of:

- [Adapt Authoring Tool](https://github.com/adaptlearning/adapt_authoring) — GPL-3.0
- [Adapt Framework](https://github.com/adaptlearning/adapt_framework) — GPL-3.0

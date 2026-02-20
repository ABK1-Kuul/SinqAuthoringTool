# v1.0.0 - The Production Release

SINQ Authoring Tool reaches production readiness. This release represents a full audit, security hardening, and zero-config packaging of the Adapt Authoring Tool for Windows.

## Highlights

### Zero-Config Deployment
- Single portable Windows executable
- Embedded MongoDB—no manual database setup
- GUI setup wizard guides you through configuration
- Fully offline-capable after initial setup

### Security Hardening
- Strict Content Security Policy (CSP)
- Context isolation and secure IPC
- Navigation locking and URL allowlisting
- Encrypted credential storage for SMTP

### Modern Stack
- Node 20+ support
- Updated dependencies (Axios, Bcrypt, and more)
- Cross-platform development with cross-env

### Automated Lifecycle
- GitHub Actions CI/CD for builds and releases
- Pre-flight environment verification
- Clear error messages when prerequisites are missing

## Installation

1. Download the portable `.exe` from the [Releases](https://github.com/ABK1-Kuul/SinqAuthoringTool/releases) page.
2. Run the executable.
3. Follow the setup wizard (~5 minutes).
4. Start creating e-learning courses.

## System Requirements

- Windows 10/11 (64-bit)
- 4GB RAM minimum (8GB recommended)
- 500MB disk space

## Documentation

- [Official Website](https://sinq-authoring.vercel.app)
- [Architecture](https://sinq-authoring.vercel.app/architecture)
- [Documentation](https://sinq-authoring.vercel.app/docs)

## Acknowledgments

Built on the [Adapt Framework](https://www.adaptlearning.org/) and [Adapt Authoring Tool](https://github.com/adaptlearning/adapt_authoring). Thank you to the Adapt Learning community.

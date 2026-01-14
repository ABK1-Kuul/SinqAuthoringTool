// Thin wrapper to keep backend entry under /backend for Electron packaging.
// Delegates to the existing server.js at the project root.
module.exports = require('../server');


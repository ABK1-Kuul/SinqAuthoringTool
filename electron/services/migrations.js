const path = require('path');
const { config, up } = require('migrate-mongo');

/**
 * Run migrations using an existing db connection.
 * @param {object} db - MongoDB db instance from backend app.
 * @param {object} client - MongoDB client (optional).
 */
async function runMigrations({ db, client }) {
  // Point migrate-mongo at repo config (no URL needed when db is passed)
  config.set(require(path.resolve(__dirname, '..', '..', 'conf', 'migrations.js')));
  await up(db, client);
}

module.exports = { runMigrations };


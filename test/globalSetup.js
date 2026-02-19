/**
 * Global setup: drop the test database before each test run.
 * Prevents E11000 duplicate key errors from leftover data (roles, tenants, users).
 * Uses native MongoClient to avoid conflicts with the app's mongoose connection.
 */
const path = require('path');
const { MongoClient } = require('mongodb');

let config;
try {
  config = require(path.join(__dirname, 'testConfig.json'));
} catch (e) {
  config = { dbHost: 'localhost', dbPort: 27017, dbName: 'adapt-tenant-mocha' };
}

const mongoUri = process.env.MONGODB_URI ||
  `mongodb://${config.dbHost || 'localhost'}:${config.dbPort || 27017}/${config.dbName || 'adapt-tenant-mocha'}`;

before(async function() {
  this.timeout(10000);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(config.dbName || 'adapt-tenant-mocha');
  await db.dropDatabase();
  await client.close();
  console.log('--- Test Database Cleared ---');
});

/**
 * Global setup: drop the test database before each test run.
 * Prevents E11000 duplicate key errors from leftover data (roles, tenants, users).
 * Uses native MongoClient to avoid conflicts with the app's mongoose connection.
 */
const path = require('path');

let config;
try {
  config = require(path.join(__dirname, 'testConfig.json'));
} catch (e) {
  config = { dbHost: 'localhost', dbPort: 27017, dbName: 'adapt-tenant-mocha' };
}

before(async function() {
  this.timeout(10000);

  if (config.dbType === 'sqlite') {
    const fs = require('fs-extra');
    const dbPath = path.join(config.dataRoot || 'testDataRoot', 'db', (config.dbName || 'adapt-tenant-mocha') + '.db');
    if (fs.existsSync(dbPath)) {
      fs.removeSync(dbPath);
    }
    console.log('--- Test SQLite Database Cleared ---');
  } else if (config.dbType === 'pg') {
    const { Client } = require('pg');
    const temp = new Client({
      user: config.dbUser || 'postgres',
      password: config.dbPass || '',
      host: config.dbHost || 'localhost',
      port: config.dbPort || 5432,
      database: 'postgres'
    });
    try {
      await temp.connect();
      await temp.query(`DROP DATABASE IF EXISTS "${config.dbName || 'adapt-tenant-mocha'}"`);
      await temp.query(`CREATE DATABASE "${config.dbName || 'adapt-tenant-mocha'}"`);
      await temp.end();
      console.log('--- Test PostgreSQL Database Cleared ---');
    } catch (e) {
      console.warn('--- Failed to clear PostgreSQL test database:', e.message);
    }
  } else {
    try {
      const { MongoClient } = require('mongodb');
      const mongoUri = process.env.MONGODB_URI ||
        `mongodb://${config.dbHost || 'localhost'}:${config.dbPort || 27017}/${config.dbName || 'adapt-tenant-mocha'}`;
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db(config.dbName || 'adapt-tenant-mocha');
      await db.dropDatabase();
      await client.close();
      console.log('--- Test MongoDB Database Cleared ---');
    } catch (e) {
      console.warn('--- Failed to clear MongoDB test database:', e.message);
    }
  }
});

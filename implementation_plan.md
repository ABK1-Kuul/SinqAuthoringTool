# Implementation Plan: SQL Database Pivot (SQLite3 & PostgreSQL)

This document contains the final details, safeguards, and implementation steps to pivot the Adapt Authoring database layer from MongoDB to **SQLite3** (for local desktop usage) and **PostgreSQL** (for cloud/SaaS deployments).

---

## 1. Safety Measures & Safeguards

To prevent breaking the application and ensure we can pivot back to MongoDB at any time, we will implement the following safeguards:

*   **Side-by-Side Driver Coexistence**: The existing `mongoose` driver will remain fully intact under `lib/dml/mongoose/`. We will not delete or modify it.
*   **Toggle-Based Activation**: The choice of database is driven entirely by the `dbType` key in `conf/config.json`. Switching back to `"dbType": "mongoose"` will immediately restore the MongoDB connection.
*   **API Compatibility Layer**:
    *   Returned rows from the SQL drivers will be wrapped in objects that mock the mongoose document interface, specifically implementing `.toObject()`, `.toJSON()`, and `.save(cb)`.
    *   The `getModel(modelName)` method will return a mocked mongoose model structure containing a `.schema.tree` reference, ensuring third-party modules and migration files that read schema fields do not crash.
*   **Identical Validation & Error Codes**:
    *   Unique index violations (e.g. duplicating a user's email or a tenant's name) in SQLite and PostgreSQL will throw errors matching MongoDB's duplicate key error code (`11000`), allowing standard handlers in `usermanager.js` and `tenantmanager.js` to catch validation errors without alteration.
*   **Flexible Identifier Validation**:
    *   `isValidIdentifier(id)` will check for both standard MongoDB-style 24-character hexadecimal IDs and standard 36-character UUIDs.

---

## 2. Technical Design

Both SQL drivers will map dynamic JSON-Schema documents into simple, relational table structures:

*   **Table Structure**: For each model name, a table is created:
    ```sql
    CREATE TABLE IF NOT EXISTS "tablename" (
      _id VARCHAR(36) PRIMARY KEY,
      data JSONB  -- (JSONB in PostgreSQL, TEXT in SQLite)
    );
    ```
*   **Indexing**: GIN indexes will be added automatically in PostgreSQL for quick querying, alongside expression indexes for common reference lookups (e.g. `_parentId`, `_tenantId`).
*   **JSON Matcher Engine**: We will write a pure JavaScript matching engine supporting MongoDB operators (`$or`, `$and`, `$in`, `$ne`, `$regex`, and dot notation paths) to run queries dynamically.
*   **Population Engine**: A relationship population engine will run in JavaScript to resolve model references (`options.populate`) recursively.

---

## 3. Detailed Implementation Steps

### Step 1: Install Dependencies
Add the following packages to `package.json`:
- `sqlite3` and `connect-sqlite3` (for local desktop session store)
- `pg` and `connect-pg-simple` (for cloud session store)

### Step 2: Implement SQLite Driver
Create `lib/dml/sqlite/index.js`, `lib/dml/sqlite/importer.js`, and `lib/dml/sqlite/types.js` implementing the DML interface.

### Step 3: Implement PostgreSQL Driver
Create `lib/dml/pg/index.js`, `lib/dml/pg/importer.js`, and `lib/dml/pg/types.js` implementing the DML interface.

### Step 4: Add Dynamic Session Stores
Update `lib/application.js` to load the session store dynamically based on the configured `dbType`.

### Step 5: Adapt Bootloader and Installer
- In `electron/main.js` and `electron/services/installation.js`, skip spawning local `mongod` processes and running MongoDB migrations if `dbType === 'sqlite'`. Set `sqlite` as the default database type in the installer setup.
- Update `install.js` database prompt questions to support `sqlite` and `pg`. If `sqlite` is chosen, skip host, port, user, and password questions.

### Step 6: Adjust Automated Tests
Modify `test/entry.js` and `test/globalSetup.js` to clean up the SQLite file or PostgreSQL database on setup/teardown instead of MongoDB.

---

## 4. Verification Plan

### Local Desktop Verification
1. Run the installer using `node install.js` and select `sqlite` as the database type.
2. Launch the application using `npm run dev` (Electron). Verify the app starts instantly without launching MongoDB.
3. Access the authoring tool, register a user, create a course, and build/add components. Check that the SQLite files are populated in the user data folder under `db/`.

### Cloud PostgreSQL Verification
1. Start a local PostgreSQL server.
2. Edit `conf/config.json` to set `"dbType": "pg"` and configure the connection string.
3. Launch the server using `node server.js` and verify tables are auto-created in Postgres and the web app works.

### Test Suite Execution
- Run `npm test` with `testConfig.json` configured for `sqlite` and `pg` to ensure all CRUD database operations pass successfully.

const Database = require('../../database').Database,
    configuration = require('../../configuration'),
    PGImporter = require('./importer').ImportManager,
    logger = require('../../logger'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    pg = require('pg'),
    async = require('async');

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + random;
}

function getValueByPath(obj, fieldPath) {
  if (!obj) return undefined;
  if (fieldPath.indexOf('.') === -1) return obj[fieldPath];
  const parts = fieldPath.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

function matchValue(docValue, queryValue) {
  if (queryValue instanceof RegExp) {
    return typeof docValue === 'string' && queryValue.test(docValue);
  }

  if (queryValue && typeof queryValue === 'object' && !Array.isArray(queryValue)) {
    const keys = Object.keys(queryValue);
    for (const key of keys) {
      if (key === '$in') {
        const arr = queryValue['$in'];
        if (!Array.isArray(arr)) return false;
        if (Array.isArray(docValue)) {
          if (!docValue.some(v => arr.some(a => String(a) === String(v)))) return false;
        } else {
          if (!arr.some(a => String(a) === String(docValue))) return false;
        }
      } else if (key === '$ne') {
        const neVal = queryValue['$ne'];
        if (String(docValue) === String(neVal)) return false;
      } else if (key === '$regex') {
        const regexStr = queryValue['$regex'];
        const options = queryValue['$options'] || '';
        const re = new RegExp(regexStr, options);
        if (typeof docValue !== 'string' || !re.test(docValue)) return false;
      } else if (key === '$gt') {
        if (!(docValue > queryValue['$gt'])) return false;
      } else if (key === '$lt') {
        if (!(docValue < queryValue['$lt'])) return false;
      } else if (key === '$gte') {
        if (!(docValue >= queryValue['$gte'])) return false;
      } else if (key === '$lte') {
        if (!(docValue <= queryValue['$lte'])) return false;
      } else {
        if (JSON.stringify(docValue) !== JSON.stringify(queryValue)) return false;
      }
    }
    return true;
  }

  if (docValue === queryValue) return true;
  if (docValue && queryValue && (docValue.toString() === queryValue.toString())) return true;

  return false;
}

function matchDocument(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key in query) {
    const val = query[key];
    if (key === '$or') {
      if (!Array.isArray(val) || val.length === 0) continue;
      if (!val.some(subQuery => matchDocument(doc, subQuery))) return false;
    } else if (key === '$and') {
      if (!Array.isArray(val)) continue;
      if (!val.every(subQuery => matchDocument(doc, subQuery))) return false;
    } else {
      const docVal = getValueByPath(doc, key);
      if (!matchValue(docVal, val)) return false;
    }
  }

  return true;
}

function wrapDoc(data, modelName, dbInstance) {
  if (!data) return data;
  const doc = { ...data };

  const schema = dbInstance._schemas[modelName.toLowerCase()];
  if (schema && schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      const prop = schema.properties[key];
      if (doc[key] === undefined && prop && prop.default !== undefined) {
        doc[key] = JSON.parse(JSON.stringify(prop.default));
      }
    });
  }

  Object.defineProperty(doc, 'toObject', {
    value: function() { return this; },
    enumerable: false,
    writable: true,
    configurable: true
  });

  Object.defineProperty(doc, 'toJSON', {
    value: function() { return this; },
    enumerable: false,
    writable: true,
    configurable: true
  });

  Object.defineProperty(doc, 'save', {
    value: function(cb) {
      dbInstance.update(modelName, { _id: this._id }, this, function(err, result) {
        if (cb) cb(err, result);
      });
    },
    enumerable: false,
    writable: true,
    configurable: true
  });

  return doc;
}

function PostgresDB() {
  Database.call(this);
  this.client = null;
  this.conn = false;
  this._schemas = {};
  this.createdAt = new Date();
}

util.inherits(PostgresDB, Database);

PostgresDB.prototype.connect = async function(db) {
  let dbName = '';
  if (typeof db === 'object') {
    dbName = db.dbName;
  } else {
    dbName = configuration.getConfig('dbName') || 'adapt-tenant-master';
  }

  const dbHost = configuration.getConfig('dbHost') || 'localhost';
  const dbPort = configuration.getConfig('dbPort') || 5432;
  const dbUser = configuration.getConfig('dbUser') || 'postgres';
  const dbPass = configuration.getConfig('dbPass') || '';
  const dbConnectionUri = configuration.getConfig('dbConnectionUri');

  let connectionString = '';
  if (dbConnectionUri) {
    connectionString = dbConnectionUri;
  } else {
    connectionString = `postgres://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${dbPort}/${dbName}`;
  }

  // Pre-connection check: Ensure PostgreSQL database exists
  if (!dbConnectionUri) {
    const tempClient = new pg.Client({
      user: dbUser,
      password: dbPass,
      host: dbHost,
      port: dbPort,
      database: 'postgres'
    });
    try {
      await tempClient.connect();
      const res = await tempClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (res.rowCount === 0) {
        await tempClient.query(`CREATE DATABASE "${dbName}"`);
      }
      await tempClient.end();
    } catch (e) {
      // Ignore database creation errors (user might not have create db permission, but database already exists)
    }
  }

  this.client = new pg.Client({ connectionString });
  await this.client.connect();

  // Ensure the PG session table exists
  try {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `);
    await this.client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
  } catch (errSession) {
    logger.log('error', 'Failed to create PostgreSQL session table:', errSession);
  }

  this.conn = { readyState: 1, connectionUri: connectionString };
  this.updatedAt = new Date();
  return this.conn;
};

PostgresDB.prototype.disconnect = function(next) {
  if (!this.client) {
    return next(new Error('Cannot disconnect: PG client not connected!'));
  }
  this.client.end(next);
};

PostgresDB.prototype.isStale = function(tenant) {
  if (!tenant.updatedAt) {
    return false;
  }
  return this.updatedAt.getTime() < new Date(tenant.updatedAt).getTime();
};

PostgresDB.prototype.isValidIdentifier = function(id) {
  return typeof id === 'string' && (id.length === 24 || id.length === 36);
};

PostgresDB.prototype.loadSchemas = function(schemaDirectory, callback) {
  fs.readdir(schemaDirectory, (error, files) => {
    if (error) {
      logger.log('error', 'failed to fetch directory listing', error);
      return callback(error);
    }

    const procFile = (file, cb) => {
      if ('.schema' === path.extname(file)) {
        const modelName = path.basename(file, '.schema');
        const fullPath = path.join(schemaDirectory, file);
        fs.readFile(fullPath, (err, data) => {
          if (err) {
            logger.log('error', 'failed to read schema file', err);
          } else {
            try {
              this.addModel(modelName, JSON.parse(data));
            } catch (parseErr) {
              logger.log('error', 'failed to parse schema file at ' + fullPath, parseErr);
            }
          }
          cb();
        });
      } else {
        cb();
      }
    };

    async.eachSeries(files, procFile, callback);
  });
};

PostgresDB.prototype.addSchema = function(modelName, schema) {
  modelName = modelName.toLowerCase();
  this._schemas[modelName] = schema;

  // Compile Postgres table using JSONB
  this.client.query(`CREATE TABLE IF NOT EXISTS "${modelName}" (_id VARCHAR(36) PRIMARY KEY, data JSONB)`, (err) => {
    if (err) {
      logger.log('error', `Failed to create PostgreSQL table for model ${modelName}:`, err);
    } else {
      // Auto-create expression indexes on parentId and tenantId for PG query speedups
      this.client.query(`CREATE INDEX IF NOT EXISTS "idx_${modelName}_tenantId" ON "${modelName}" ((data->>'_tenantId'))`, (errTenant) => {
        if (errTenant) logger.log('warn', `Could not create tenant index for ${modelName}`, errTenant);
      });
      this.client.query(`CREATE INDEX IF NOT EXISTS "idx_${modelName}_parentId" ON "${modelName}" ((data->>'_parentId'))`, (errParent) => {
        if (errParent) logger.log('warn', `Could not create parent index for ${modelName}`, errParent);
      });
    }
  });
};

PostgresDB.prototype.getModel = function(modelName) {
  if (!modelName || 'string' !== typeof modelName) {
    return false;
  }
  modelName = modelName.toLowerCase();
  const schema = this._schemas[modelName];
  if (!schema) return false;
  return {
    schema: {
      tree: schema.properties || schema
    }
  };
};

PostgresDB.prototype.getModelNames = function() {
  return Object.keys(this._schemas);
};

PostgresDB.prototype.buildPopulator = function(options) {
  return options;
};

PostgresDB.prototype.buildQuery = function(options) {
  return options;
};

PostgresDB.prototype.checkUniqueConstraints = function(table, schema, doc, callback) {
  if (!schema) return callback(null);

  const uniqueFields = [];
  Object.keys(schema).forEach(key => {
    const prop = schema[key];
    if (prop.unique || (prop.index && prop.index.unique)) {
      uniqueFields.push(key);
    }
  });

  if (uniqueFields.length === 0) return callback(null);

  this.client.query(`SELECT data FROM "${table}"`, (err, res) => {
    if (err) return callback(err);
    const rows = res.rows;
    for (const row of rows) {
      const item = row.data;
      if (item._id === doc._id) continue;
      for (const field of uniqueFields) {
        if (item[field] !== undefined && item[field] === doc[field]) {
          const error = new Error(`Duplicate key error: field '${field}' with value '${doc[field]}' already exists.`);
          error.code = 11000;
          return callback(error);
        }
      }
    }
    callback(null);
  });
};

PostgresDB.prototype.create = function(objectType, objectData, callback) {
  const table = objectType.toLowerCase();
  const schema = this._schemas[table];

  if (!objectData._id) {
    objectData._id = generateObjectId();
  }

  if (schema) {
    Object.keys(schema).forEach(key => {
      if (objectData[key] === undefined && schema[key].default !== undefined) {
        objectData[key] = JSON.parse(JSON.stringify(schema[key].default));
      }
    });
  }

  this.checkUniqueConstraints(table, schema, objectData, (err) => {
    if (err) return callback(err);

    const sql = `INSERT INTO "${table}" (_id, data) VALUES ($1, $2)`;
    const params = [objectData._id, JSON.stringify(objectData)];

    this.client.query(sql, params, (runErr) => {
      if (runErr) {
        if (runErr.code === '23505') { // Postgres duplicate key error code
          const dupErr = new Error(runErr.message);
          dupErr.code = 11000;
          return callback(dupErr);
        }
        return callback(runErr);
      }
      callback(null, wrapDoc(objectData, table, this));
    });
  });
};

async function populateDocs(dbInstance, modelName, docs, populateOpt) {
  if (!docs || (Array.isArray(docs) && docs.length === 0)) return docs;
  if (!populateOpt) return docs;

  const isArray = Array.isArray(docs);
  const docList = isArray ? docs : [docs];

  let paths = [];
  if (typeof populateOpt === 'string') {
    paths = populateOpt.split(' ').map(p => ({ path: p }));
  } else if (Array.isArray(populateOpt)) {
    paths = populateOpt.map(p => typeof p === 'string' ? { path: p } : p);
  } else if (typeof populateOpt === 'object') {
    paths = Object.keys(populateOpt).map(key => {
      let select = populateOpt[key];
      if (Array.isArray(select)) select = select.join(' ');
      return { path: key, select };
    });
  }

  const schema = dbInstance._schemas[modelName.toLowerCase()];
  if (!schema) return docs;

  for (const p of paths) {
    const field = p.path;
    const selectFields = p.select ? p.select.split(' ').filter(Boolean) : null;

    let targetModel = null;
    const prop = schema[field];
    if (prop) {
      if (prop.ref) {
        targetModel = prop.ref;
      } else if (prop.items && prop.items.ref) {
        targetModel = prop.items.ref;
      }
    }

    if (!targetModel) continue;

    const idsToFetch = new Set();
    for (const doc of docList) {
      const val = doc[field];
      if (typeof val === 'string' && val) {
        idsToFetch.add(val);
      } else if (Array.isArray(val)) {
        val.forEach(v => {
          if (typeof v === 'string' && v) idsToFetch.add(v);
        });
      }
    }

    if (idsToFetch.size === 0) continue;

    const fetchedDocs = await new Promise((resolve) => {
      dbInstance.retrieve(targetModel, { _id: { $in: Array.from(idsToFetch) } }, (err, results) => {
        if (err || !results) return resolve({});
        const map = {};
        results.forEach(d => {
          map[d._id] = d;
        });
        return resolve(map);
      });
    });

    for (const doc of docList) {
      const val = doc[field];
      if (typeof val === 'string' && val) {
        let refDoc = fetchedDocs[val];
        if (refDoc) {
          if (selectFields) {
            const filtered = { _id: refDoc._id };
            selectFields.forEach(f => { filtered[f] = refDoc[f]; });
            refDoc = filtered;
          }
          doc[field] = refDoc;
        }
      } else if (Array.isArray(val)) {
        doc[field] = val.map(v => {
          if (typeof v === 'string' && v) {
            let refDoc = fetchedDocs[v];
            if (refDoc) {
              if (selectFields) {
                const filtered = { _id: refDoc._id };
                selectFields.forEach(f => { filtered[f] = refDoc[f]; });
                refDoc = filtered;
              }
              return refDoc;
            }
          }
          return v;
        });
      }
    }
  }

  return docs;
}

PostgresDB.prototype.retrieve = function(objectType, search, options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }
  const table = objectType.toLowerCase();

  let sql = `SELECT data FROM "${table}"`;
  const params = [];

  // SQL-level query optimization for _id in JSONB
  if (search && typeof search._id === 'string') {
    sql += ' WHERE _id = $1';
    params.push(search._id);
  } else if (search && search._id && typeof search._id === 'object' && search._id.$in && Array.isArray(search._id.$in)) {
    const placeholders = search._id.$in.map((_, idx) => `$${idx + 1}`).join(',');
    sql += ` WHERE _id IN (${placeholders})`;
    params.push(...search._id.$in);
  }

  this.client.query(sql, params, (err, res) => {
    if (err) return callback(err);

    let results = [];
    const rows = res.rows;
    rows.forEach(row => {
      // Row data is already a JSON object when fetched from pg JSONB column
      results.push(typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    });

    results = results.filter(doc => matchDocument(doc, search));

    const operators = options.operators;
    if (operators && operators.sort) {
      results.sort((a, b) => {
        for (const sortField in operators.sort) {
          const dir = operators.sort[sortField];
          const valA = getValueByPath(a, sortField);
          const valB = getValueByPath(b, sortField);
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    if (operators) {
      if (operators.skip) {
        results = results.slice(parseInt(operators.skip, 10));
      }
      if (operators.limit) {
        results = results.slice(0, parseInt(operators.limit, 10));
      }
    }

    populateDocs(this, table, results, options.populate).then((populated) => {
      const finalResults = populated.map(doc => wrapDoc(doc, table, this));
      callback(null, finalResults);
    }).catch(callback);
  });
};

PostgresDB.prototype.retrieveOne = function(objectType, search, options, callback) {
  this.retrieve(objectType, search, options, (err, results) => {
    if (err) return callback(err);
    if (results && results.length) return callback(null, results[0]);
    callback(null, null);
  });
};

PostgresDB.prototype.update = function(objectType, conditions, updateData, callback) {
  const table = objectType.toLowerCase();
  const schema = this._schemas[table];

  this.retrieve(table, conditions, {}, (err, docs) => {
    if (err) return callback(err);
    if (!docs || docs.length === 0) return callback(null, null, 0);

    const doc = docs[0];
    const originalId = doc._id;

    for (const field in updateData) {
      doc[field] = updateData[field];
    }
    doc._id = originalId;

    this.checkUniqueConstraints(table, schema, doc, (uniqueErr) => {
      if (uniqueErr) return callback(uniqueErr);

      const sql = `UPDATE "${table}" SET data = $1 WHERE _id = $2`;
      const params = [JSON.stringify(doc), doc._id];

      this.client.query(sql, params, (updateErr) => {
        if (updateErr) return callback(updateErr);
        callback(null, wrapDoc(doc, table, this));
      });
    });
  });
};

PostgresDB.prototype.destroy = function(objectType, conditions, callback) {
  const table = objectType.toLowerCase();

  this.retrieve(table, conditions, {}, (err, docs) => {
    if (err) return callback(err);
    if (!docs || docs.length === 0) return callback(null);

    const sql = `DELETE FROM "${table}" WHERE _id = $1`;
    async.eachSeries(docs, (doc, cb) => {
      this.client.query(sql, [doc._id], cb);
    }, callback);
  });
};

PostgresDB.prototype.importSchema = function(uri, schema, next) {
  const importManager = new PGImporter();
  const importer = importManager.getImporter(uri);
  importer.importSchema(schema, () => {
    if (importer.error) {
      return next(importer.error);
    }
    importer.getSchema((err, importedSchema) => {
      if (err) return next(err);
      next(null, importedSchema);
    });
  });
};

PostgresDB.prototype.exportResults = function(results, next) {
  const transformSingle = (item) => {
    const rawSchema = this._schemas[item._type ? item._type.toLowerCase() : ''];
    if (!rawSchema) return item;

    const json = { ...item };
    Object.keys(rawSchema).forEach((key) => {
      if (rawSchema[key].editorOnly && json.hasOwnProperty(key)) {
        delete json[key];
      }
      if (rawSchema[key].protect && json.hasOwnProperty(key)) {
        delete json[key];
      }
    });
    return json;
  };

  if (util.isArray(results)) {
    const transformed = results.map(item => transformSingle(item));
    next(transformed);
  } else if ('object' === typeof results && results !== null) {
    next(transformSingle(results));
  } else {
    next(results);
  }
};

exports = module.exports = PostgresDB;

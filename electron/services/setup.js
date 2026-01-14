const helpers = require('../../lib/helpers');
const localAuth = require('../../plugins/auth/local');

async function ensureMasterTenant(app, masterTenantConfig) {
  const { name, displayName } = masterTenantConfig || {};
  if (!name) return null;
  return new Promise((resolve, reject) => {
    app.tenantmanager.retrieveTenant({ name }, (err, tenant) => {
      if (err) return reject(err);
      if (tenant) return resolve(tenant);
      app.tenantmanager.createTenant({
        name,
        displayName: displayName || name,
        isMaster: true,
        database: {
          dbName: app.configuration.getConfig('dbName'),
          dbHost: app.configuration.getConfig('dbHost'),
          dbUser: app.configuration.getConfig('dbUser'),
          dbPass: app.configuration.getConfig('dbPass'),
          dbPort: app.configuration.getConfig('dbPort'),
        },
      }, (createErr, created) => {
        if (createErr) return reject(createErr);
        resolve(created);
      });
    });
  });
}

async function ensureSuperAdmin(app, tenant, adminConfig, secrets = {}) {
  const { email } = adminConfig || {};
  const password = secrets.adminPassword || adminConfig?.password;
  if (!tenant || !email || !password) return null;
  const auth = new localAuth();
  return new Promise((resolve, reject) => {
    app.usermanager.deleteUser({ email }, (delErr) => {
      if (delErr) return reject(delErr);
      auth.internalRegisterUser(true, {
        email,
        password,
        retypePassword: password,
        _tenantId: tenant._id,
      }, (regErr, user) => {
        if (regErr) return reject(regErr);
        helpers.grantSuperPermissions(user._id, (permErr) => {
          if (permErr) return reject(permErr);
          resolve(user);
        });
      });
    });
  });
}

async function ensureCore(app, config, secrets = {}) {
  const tenant = await ensureMasterTenant(app, config.masterTenant);
  if (tenant) {
    await ensureSuperAdmin(app, tenant, config.admin, secrets);
  }
}

module.exports = {
  ensureCore,
};


const path = require('path');
const app = require('./lib/application')();

app.run({ skipVersionCheck: true, skipDependencyCheck: true });

app.on('serverStarted', async () => {
  console.log('App started! Fetching plugins from DB...');
  
  const db = app.db;
  const pluginTypes = ['themetype', 'menutype', 'componenttype', 'extensiontype'];
  const pluginsToInstall = [];

  for (const type of pluginTypes) {
    await new Promise((resolve) => {
      db.retrieve(type, {}, {}, (err, results) => {
        if (err) {
          console.error(`Error retrieving ${type}:`, err);
        }
        if (!err && results) {
          results.forEach(r => {
            let data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
            let version = r.version || (data && data.version) || '*';
            pluginsToInstall.push({ name: r.name, version, type });
          });
        }
        resolve();
      });
    });
  }

  console.log(`Found ${pluginsToInstall.length} plugins in DB to restore:`);
  pluginsToInstall.forEach(p => console.log(`- Name: ${p.name}, Version: ${p.version}`));

  const { createRequire } = require('module');
  const requireWorkspace = createRequire('c:/SINQ_authoring_desktop/adapt_authoring-1/package.json');
  const async = requireWorkspace('async');

  async.eachSeries(pluginsToInstall, (plugin, callback) => {
    console.log(`Force installing plugin: ${plugin.name} (version: ${plugin.version})...`);
    app.bowermanager.installPlugin(plugin.name, plugin.version, (err) => {
      if (err) {
        console.error(`Failed to force install plugin ${plugin.name}:`, err);
      } else {
        console.log(`Successfully force installed ${plugin.name}`);
      }
      callback(null); // Continue even if one fails
    });
  }, (err) => {
    console.log('All plugins restored!');
    process.exit(0);
  });
});

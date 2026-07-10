const path = require('path');
const configuration = require('../../lib/configuration');
const express = require('express');
const server = module.exports = express();
const origin = require('../../lib/application');
const app = origin();
const installHelper = require('../../lib/installHelpers');
const logger = require('../../lib/logger');

let _versions = {};

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/', function (req, res, next) {
  res.sendFile(path.join(configuration.getConfig('serverRoot'), 'frontend', 'build', 'index.html'));
});

async function getVersions() {
  if (Object.keys(_versions).length) return _versions;

  installHelper.getInstalledVersions((error, data) => {
    if (error) {
      logger.log('error', error);
    }
    _versions = data;
    return _versions;
  });
}

// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');

var configuration = require('./configuration');
var logger = require('./logger');

/*
 * CONSTANTS
 */
var MODNAME = 'router';

/**
 * @constructor
 */
function Router (options) {
  this.options = {
    'path' : path.join(configuration.serverRoot, 'routes')
  };

  options && (this.options = _.extend(this.options, options));
}

Router.prototype.init = function (app) {
  var basePath = this.options.path;
  var server = app.server;
  fs.readdir(basePath, function(error, contents) {
    if(error) {
      logger.log('error', error);
      return;
    }
    async.each(contents, function(item, cb) {
      var itemPath = path.join(basePath, item);
      if(!fs.statSync(itemPath).isDirectory()) {
        return;
      }
      try {
        var route = require(itemPath);
        if (!route || typeof route.handle !== 'function') {
          logger.log('error', `Cannot load routes/${item}, module did not export an express app (got ${typeof route}).`);
          return;
        }
        server.use(route);
      } catch(e) {
        // if the top-level module can't be loaded, it's the index.js
        var detail = (e.message.indexOf(`'${itemPath}'`) === -1) ? e.message : 'no index.js found';
        logger.log('error', `Cannot load routes/${item}, ${detail}${e.stack ? ' :: ' + e.stack : ''}`);
      }
    });
  });
};

function createRouter (app) {
  if (!this.router || !(this.router instanceof Router)) {
    this.router = new Router();
    app.on('serverStarted', this.router.init.bind(this.router, app));
    app.on('minimalServerStarted', this.router.init.bind(this.router, app));
  }

  return this.router;
}

exports = module.exports = createRouter;

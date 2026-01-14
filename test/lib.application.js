var request = require('supertest');
var should = require('should');

// Require backend app directly to avoid Electron main in tests
var origin = require('../lib/application');

it('should be listening to HTTP requests on the specified host/port', function(done) {
  var agent = request.agent(origin().getServerURL())
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .expect('Content-Type', /html/)
    .end(done);
});

it('should inherit from event emitter', function(done) {
  var app = origin();
  app.on('foo', done);
  app.emit('foo');
});

var pull = require('pull-stream');
var test = require('tape');
var muxrpc = require('muxrpc');
var MultiServer = require('multiserver');
var EventEmitter = require('events');
var rnChannelPlugin = require('./index');

function createChannels() {
  var serverChannel = new EventEmitter();
  var clientChannel = new EventEmitter();
  serverChannel.send = function(raw) {
    clientChannel.emit('message', raw);
  };
  clientChannel.send = function(raw) {
    serverChannel.emit('message', raw);
  };
  return {serverChannel, clientChannel};
}

test('basic server and client work correctly', function(t) {
  var {serverChannel, clientChannel} = createChannels();
  var ms1 = MultiServer([rnChannelPlugin(serverChannel)]);

  ms1.server(function(stream) {
    pull(stream, pull.map(s => s.toUpperCase()), stream);
  });

  var ms2 = MultiServer([rnChannelPlugin(clientChannel)]);

  ms2.client('channel', function(err, stream) {
    t.error(err, 'no error initializing multiserver');
    pull(
      pull.values(['alice', 'bob']),
      stream,
      pull.collect(function(err2, arr) {
        t.error(err2, 'no error from worker');
        t.deepEqual(arr, ['ALICE', 'BOB'], 'data got uppercased in the worker');
        t.end();
      }),
    );
  });
});

test('muxrpc server and client work correctly', function(t) {
  t.plan(3);
  var manifest = {
    stuff: 'source',
  };

  var {serverChannel, clientChannel} = createChannels();
  var ms1 = MultiServer([rnChannelPlugin(serverChannel)]);

  ms1.server(function(stream) {
    var server = muxrpc(null, manifest)({
      stuff: function() {
        return pull.values([2, 4, 6, 8]);
      },
    });

    pull(stream, server.createStream(), stream);
  });

  var ms2 = MultiServer([rnChannelPlugin(clientChannel)]);

  ms2.client('channel', function(err, stream) {
    if (err) console.error(err.stack);
    t.error(err, 'no error initializing multiserver');
    var client = muxrpc(manifest, null)();
    pull(
      client.stuff(),
      pull.collect(function(err2, arr) {
        t.error(err2, 'no error from worker');
        t.deepEqual(arr, [2, 4, 6, 8], 'got data sourced from the worker');
        t.end();
      }),
    );
    pull(stream, client.createStream(), stream);
  });
});

test('forcefully exit even if some child workers are running', function(t) {
  t.end();
  process.exit(0);
});

# multiserver-rn-channel

_A [multiserver](https://github.com/ssbc/multiserver) plugin for Node.js Mobile React Native 'channels'_

```
npm install --save multiserver-rn-channel
```

This module is a multiserver plugin which allows a Node.js Mobile React Native "channel" (a special EventEmitter) to be a server or a client.

## Usage

**frontend.js**

```js
var pull = require('pull-stream');
var MultiServer = require('multiserver');
var rnChannelPlugin = require('multiserver-rn-channel');
var nodejs = require('nodejs-mobile-react-native');

var ms = MultiServer([
  rnChannelPlugin(nodejs.channel)
]);

ms.client('channel', function(err, stream) {
  pull(
    pull.values(['alice', 'bob']),
    stream,
    pull.drain(x => {
      console.log(x); // ALICE
                      // BOB
    })
  );
});
```

**backend.js**

```js
var pull = require('pull-stream');
var MultiServer = require('multiserver');
var rnChannelPlugin = require('multiserver-worker');
var rn_bridge = require('rn-bridge');

var ms = MultiServer([
  rnChannelPlugin(rn_bridge.channel)
]);

ms.server(function(stream) {
  pull(
    stream,
    pull.map(s => s.toUpperCase()),
    stream
  );
});
```

## Usage with [muxrpc](https://github.com/ssbc/muxrpc)

**main.js**

```js
// ...
ms.client('channel', function(err, stream) {
  var manifest = {
    stuff: 'source'
  };
  var client = muxrpc(manifest, null)();

  pull(
    client.stuff(),
    pull.drain(x => {
      console.log(x); // 2
                      // 4
                      // 6
                      // 8
    })
  );

  pull(stream, client.createStream(), stream);
});
// ...
```

**worker.js**

```js
// ...
ms.server(function(stream) {
  var manifest = {
    stuff: 'source'
  };
  var server = muxrpc(null, manifest)({
    stuff: function() {
      return pull.values([2, 4, 6, 8]);
    }
  });

  pull(stream, server.createStream(), stream);
});
// ...
```
const toDuplex = require('pull-rn-channel');

module.exports = function makePlugin(opts) {
  return {
    name: 'channel',

    scope: function() {
      return 'device';
    },

    server: function(onConnection, onError) {
      const channel = !!opts ? opts.channel || opts : null;
      if (!channel) {
        onError(
          new Error(
            'multiserver-rn-channel plugin requires the channel given in ' +
              'the opts argument when starting the server'
          )
        );
        return function() {};
      }
      onConnection(toDuplex(channel));
      return function() {};
    },

    client: function(_address, cb) {
      try {
        const channel = !!opts ? opts.channel || opts : null;
        if (!channel) {
          throw new Error(
            'multiserver-rn-channel plugin requires the channel given in ' +
              'the opts argument when starting the client'
          );
        }
        const stream = toDuplex(channel);
        stream.channel = channel;
        cb(null, stream);
      } catch (err) {
        cb(err);
      }
    },

    // MUST be 'channel' string
    parse: function(s) {
      if (s !== 'channel') return null;
      return {name: 'channel'};
    },

    stringify: function() {
      return 'channel';
    },
  };
};

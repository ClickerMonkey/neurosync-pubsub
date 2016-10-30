// UMD (Universal Module Definition)
(function (root, factory)
{
  if (typeof define === 'function' && define.amd) // jshint ignore:line
  {
    // AMD. Register as an anonymous module.
    define(['Rekord', 'PubSub'], function(Rekord, PubSub) { // jshint ignore:line
      return factory(root, Rekord, PubSub);
    });
  }
  else if (typeof module === 'object' && module.exports)  // jshint ignore:line
  {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('Rekord'), require('PubSub'));  // jshint ignore:line
  }
  else
  {
    // Browser globals (root is window)
    root.Rekord = factory(root, root.Rekord, root.PubSub);
  }
}(this, function(global, Rekord, PubSub, undefined)
{

  var OP_SAVE = 1;
  var OP_REMOVE = 2;

  var cache = {};

  function get(url)
  {
    return url in cache ? cache[ url ] : ( cache[ url ] = new PubSub( url ) );
  }

  function LiveFactory(database)
  {
    if ( !database.pubsub || !database.channel || !database.token )
    {
      return {
        save: Rekord.noop,
        remove: Rekord.noop
      };
    }

    var pubsub = get( database.pubsub );
    var channel = pubsub.subscribe( database.channel, database.token );

    Rekord.debug( Rekord.Debugs.PUBSUB_CREATED, pubsub );

    function handlePublish(message)
    {
      if ( !Rekord.forceOffline )
      {
        if ( message.op === OP_SAVE )
        {
          database.liveSave( message.key, message.model );
        }
        if ( message.op === OP_REMOVE )
        {
          database.liveRemove( message.key );
        }
      }
    }

    channel.onpublish = handlePublish;

    return {

      channel: channel,
      pubsub: pubsub,

      save: function(model, data)
      {
        if ( !Rekord.forceOffline )
        {
          channel.publish(
          {
            op: OP_SAVE,
            key: model.$key(),
            model: data
          });
        }
      },

      remove: function(model)
      {
        if ( !Rekord.forceOffline )
        {
          channel.publish(
          {
            op: OP_REMOVE,
            key: model.$key()
          });
        }
      }

    };
  }

  Rekord.setLive( LiveFactory, true );

  return Rekord;

}));

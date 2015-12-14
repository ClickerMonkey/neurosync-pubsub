
Neuro.live = (function()
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
        save: Neuro.noop, 
        remove: Neuro.noop 
      };
    }

    var pubsub = get( database.pubsub );
    var channel = pubsub.subscribe( database.channel, database.token );

    Neuro.debug( Neuro.Debugs.PUBSUB_CREATED, pubsub );

    function handlePublish(message)
    {
      if ( !Neuro.forceOffline )
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
        if ( !Neuro.forceOffline )
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
        if ( !Neuro.forceOffline )
        {
          channel.publish(
          {
            op: OP_REMOVE,
            key: model.$key()
          });
        }
      }

    };
  };

  return LiveFactory;

})();
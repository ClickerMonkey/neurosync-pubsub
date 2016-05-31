(function(global, Rekord, PubSub)
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

})( this, this.Rekord, this.PubSub );

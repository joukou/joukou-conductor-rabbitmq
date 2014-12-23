amqplib = require('amqplib')
Q       = require('q')
uuid    = require('node-uuid')

class RabbitMQClient
  _channelDeferred: null
  connection: null
  channel: null
  key: null
  exchange: null
  consumer: null
  on:
    connection: null
    channel: null
  constructor: (exchange, key) ->
    this.exchange = exchange
    this.key = key
    this._channelDeferred = Q.defer()
    this.on =
      connection: amqplib.connect(exchange)
      channel: this._channelDeferred.promise
    this._setupConnection()
  _setupConnection: ->
    this.on.connection.then( =>
      @_onConnection.apply(@, arguments)
    ).catch( (err) =>
      @_channelDeferred.reject(err)
      return
    )
  _onConnection: (connection) ->
    this.connection = connection
    this._setupChannel()
  _setupChannel: ->
    ok = this.connection.createChannel()
    ok.then( =>
      @_onChannel.apply(@, arguments)
      return
    ).catch( (err) =>
      @_channelDeferred.reject(err)
      return
    )
  _onChannel: (channel) ->
    this.channel = channel
    this._channelDeferred.resolve(@)
  cancel: (consumerTag) ->
    # Not connected
    if not this.channel
      return Q.reject(new Error("Not connected"))
    this.channel.cancel(consumerTag)
  consume: (callback, contentOnly, consumerTag) ->
    #Un promise-able, callback is called multiple times
    if callback not instanceof Function
      throw new TypeError("Callback is expected to be a Function")
    if not consumerTag
      # Create one so they can cancel it
      consumerTag = uuid.v4()
    this.on.channel.then(=>
      @channel.assertQueue(@key)
      @channel.consume(@key, (message) ->
        # Filter the duds here
        if message is null or message is undefined
          return
        if contentOnly
          message = message.content
        # Check again
        if message is null or message is undefined
          return
        callback(null, message)
      , consumerTag: consumerTag
      )
    )
    .fail( (err) ->
      callback(err, null)
      return
    )
    consumerTag
  send: (message) ->
    if not Buffer.isBuffer( message )
      if typeof message isnt 'string'
        message = JSON.stringify(message)
      message = new Buffer(message)
    deferred = Q.defer()
    this.on.channel.then( =>
      @channel.assertQueue(@key)
      # sendToQueue should return a response from Buffer.write
      # http://nodejs.org/api/buffer.html#buffer_buf_write_string_offset_length_encoding
      deferred.resolve(
        @channel.sendToQueue(@key, message)
      )
      null
    )
    .fail(
      deferred.reject
    )
    return deferred.promise
module.exports =
  getClient: (exchange, key) ->
    return new RabbitMQClient(exchange, key)
  RabbitMQClient: RabbitMQClient
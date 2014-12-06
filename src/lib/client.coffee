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
    client = this
    this.on.connection.then( ->
      client._onConnection.apply(client, arguments)
    ).fail( (err) ->
      this._channelDeferred.reject(err)
      return
    )
  _onConnection: (connection) ->
    this.connection = connection
    this._setupChannel()
  _setupChannel: ->
    client = this
    ok = this.connection.createChannel()
    ok.then( ->
      client._onChannel.apply(client, arguments)
      return
    ).fail( (err) ->
      this._channelDeferred.reject(err)
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
    client = this
    this.on.channel.then(->
      client.channel.assertQueue(client.key)
      client.channel.consume(client.key, (message) ->
        # Filter the duds here
        if message is null or message is undefined
          return
        if contentOnly
          message = message.content
        # Check again
        if message is null or message is undefined
          return
        callback(null, message)
      , consumerTag: consumerTag)
      .fail((err) ->
        callback(err, null)
      )
    )
    .fail( (err) ->
      callback(err, null)
      return
    )
    consumerTag
  send: (message) ->
    if typeof message isnt 'string'
      message = JSON.stringify(message)
    if message not instanceof Buffer
      message = new Buffer(message)
    client = this
    deferred = Q.defer()
    this.on.channel.then( ->
      client.channel.assertQueue(client.key)
      # sendToQueue should return a response from Buffer.write
      # http://nodejs.org/api/buffer.html#buffer_buf_write_string_offset_length_encoding
      deferred.resolve(
        client.channel.sendToQueue(client.key, message)
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
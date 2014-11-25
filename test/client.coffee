chai              = require( 'chai' )
proxyquire        = require( 'proxyquire' )
chaiAsPromised    = require( 'chai-as-promised' )
chai.use(chaiAsPromised)
expect            = chai.expect
assert            = chai.assert
clientModule      = require( '../dist' ).RabbitMQClient
Q                 = require( 'q' )


class MockedClient
  constructor: ->
    # Don't call super
    this.on =
      channel: Q.resolve(MockedClient.prototype.channel)
      connection: Q.resolve(MockedClient.prototype.connection)

MockedClient.prototype = Object.create(clientModule.RabbitMQClient.prototype, {})
# Remove the requirements for proxy require
MockedClient.prototype.channel = {
  tags: []
  cancel: (consumerTag) ->
    return Q.resolve()
  consume: (key, callback, options) ->
    return Q.resolve()
  assertQueue: (key) ->
    return true
}
MockedClient.prototype.connection = {
  createChannel: ->
    return Q.resolve(MockedClient.prototype.channel)
}

mockedClient = proxyquire( '../dist/lib/client', {
  'amqplib': {
    connect: ->
      Q.resolve(MockedClient.prototype.connection)
  }
})

describe 'rabbitmq client', ->
  specify "has client", ->
    expect(clientModule).to.include.key('RabbitMQClient')
  specify "has get client", ->
    expect(clientModule).to.include.key('getClient')
  specify "creates client", ->
    client = mockedClient.getClient("EXCHANGE", "KEY")
    expect(client).to.be.instanceof(mockedClient.RabbitMQClient)
  specify "uses exchange", ->
    exchange = "EXCHANGE_1"
    client = mockedClient.getClient(exchange, "KEY")
    expect(client.exchange).to.equal(exchange)
  specify "uses key", ->
    key = "KEY_1"
    client = mockedClient.getClient("EXCHANGE", key)
    expect(client.key).to.equal(key)
  specify "starts create connection", ->
    client = mockedClient.getClient("EXCHANGE", "KEY")
    expect(client.on.connection).to.exist
  specify "connection set", (done) ->
    client = mockedClient.getClient("EXCHANGE", "KEY")
    client.on.connection.then(->
      try
        expect(client.connection).to.exist
        done()
      catch err
        done(err)
    )
  specify "channel set", (done) ->
    client = mockedClient.getClient("EXCHANGE", "KEY")
    client.on.channel.then(->
      console.log("On channel")
      try
        expect(client.channel).to.exist
        done()
      catch err
        done(err)
    )
  specify "cancel works", ->
    cancel = MockedClient.prototype.channel.cancel
    consumerTag = "TAG"
    MockedClient.prototype.channel.cancel = (tag) ->
      expect(tag).to.equal(consumerTag)
      return consumerTag
    client = new MockedClient()
    expect(client.cancel(consumerTag)).to.equal(consumerTag)
    MockedClient.prototype.channel.cancel = cancel
  specify "cancel throws if not channel", (done) ->
    channel = MockedClient.prototype.channel
    MockedClient.prototype.channel = null
    client = new MockedClient()
    expect(client.cancel('')).to.eventually.be.rejectedWith(Error, 'Not connected').notify(done)
    MockedClient.prototype.channel = channel
  specify "consume throws if not callback", ->
    client = new MockedClient()
    expect(->
      client.consume(null, '', '')
    ).to.Throw(TypeError, 'Callback is expected to be a Function')
  specify "consume creates new consumer tag", ->
    client = new MockedClient()
    client.on.channel = Q.defer().promise
    callback = ->
    tag = client.consume(callback,'','')
    expect(typeof tag).to.equal('string')
    expect(tag).to.be.ok
    expect(tag.length > 0).to.be.ok
  specify "consume doesn't call callback if message empty - not content", ->
    consume = MockedClient.prototype.channel.consume

    channelCalled = no
    MockedClient.prototype.channel.consume = (tag, callback) ->
      channelCalled = yes
      callback(null)
    client = new MockedClient()
    callbackCalled = no
    callback = ->
      callbackCalled = yes

    client.on.channel =
      then: (callback) ->
        callback()
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.consume(callback)

    expect(channelCalled).to.be.ok
    expect(callbackCalled).to.be.not.ok

    MockedClient.prototype.channel.consume = consume
  specify "consume calls callback if message not empty - not content", ->
    consume = MockedClient.prototype.channel.consume
    messageToSend = {message:'MESSAGE'}
    MockedClient.prototype.channel.consume = (tag, callback) ->
      callback(messageToSend)
    client = new MockedClient()

    callbackCalled = no
    message = null
    callback = (err, msg) ->
      callbackCalled = yes
      message = msg

    client.on.channel =
      then: (callback) ->
        callback(client.channel)
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.consume(callback)

    expect(callbackCalled).to.be.ok
    expect(message).to.equal(messageToSend)

    MockedClient.prototype.channel.consume = consume
  specify "consume doesn't call callback if message empty - content", ->
    consume = MockedClient.prototype.channel.consume

    channelCalled = no
    MockedClient.prototype.channel.consume = (tag, callback) ->
      channelCalled = yes
      callback({})
    client = new MockedClient()
    callbackCalled = no
    callback = ->
      callbackCalled = yes

    client.on.channel =
      then: (callback) ->
        callback()
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.consume(callback, yes)

    expect(channelCalled).to.be.ok
    expect(callbackCalled).to.be.not.ok


    MockedClient.prototype.channel.consume = consume
  specify "consume calls callback if message not empty - content", ->
    consume = MockedClient.prototype.channel.consume
    messageToSend = {content:{message:true}}
    MockedClient.prototype.channel.consume = (tag, callback) ->
      callback(messageToSend)
    client = new MockedClient()

    callbackCalled = no
    message = null
    callback = (err, msg) ->
      callbackCalled = yes
      message = msg

    client.on.channel =
      then: (callback) ->
        callback(client.channel)
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.consume(callback, yes, "TAG")

    expect(callbackCalled).to.be.ok
    expect(message).to.equal(messageToSend.content)

    MockedClient.prototype.channel.consume = consume
  specify "send message is made a buffer if not already", ->
    sendToQueue = MockedClient.prototype.channel.sendToQueue

    messageSent = null
    messageToSend = 'MESSAGE'

    MockedClient.prototype.channel.sendToQueue = (tag, message) ->
      messageSent = message

    client = new MockedClient()

    client.on.channel =
      then: (callback) ->
        callback()
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.send(messageToSend)

    expect(messageSent).to.exist
    expect(messageSent.toString()).to.equal(messageToSend)

    MockedClient.prototype.channel.sendToQueue = sendToQueue
  specify "send message sends", ->
    sendToQueue = MockedClient.prototype.channel.sendToQueue

    messageSent = null
    messageToSend = new Buffer('MESSAGE')

    MockedClient.prototype.channel.sendToQueue = (tag, message) ->
      messageSent = message

    client = new MockedClient()

    client.on.channel =
      then: (callback) ->
        callback()
        return {
          then: ->
          fail: ->
        }
      fail: () ->

    client.send(messageToSend)

    expect(messageSent.toString()).to.equal(messageToSend.toString())

    MockedClient.prototype.channel.sendToQueue = sendToQueue




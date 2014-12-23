JoukouConductorExchange   = process.env["JOUKOU_CONDUCTOR_EXCHANGE"]
JoukouConductorRoutingKey = process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"]

JoukouFleetAPIHost        = process.env["JOUKOU_FLEET_API_HOST"]
JoukouFleetAPIPath        = process.env["JOUKOU_FLEET_API_PATH"]

RabbitMQClient            = require('./client')
request                   = require('request')
fleet                     = require('joukou-conductor-fleet')
noflo                     = require('joukou-conductor-noflo').SystemD
httpClient                = require('./http-client')

# Set the ENV variable for next time
# This does not effect global env just this process
if not JoukouConductorExchange
  JoukouConductorExchange = "amqp://localhost"
  process.env["JOUKOU_CONDUCTOR_EXCHANGE"] = JoukouConductorExchange

if not JoukouConductorRoutingKey
  JoukouConductorRoutingKey = "CONDUCTOR"
  process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"] = JoukouConductorRoutingKey

if not JoukouFleetAPIHost
  JoukouFleetAPIHost = "localhost:4002"
  process.env["JOUKOU_FLEET_API_HOST"] = JoukouFleetAPIHost

if not JoukouFleetAPIPath
  JoukouFleetAPIPath = "/v1/"
  process.env["JOUKOU_FLEET_API_PATH"] = JoukouFleetAPIPath

class ConductorRabbitMQClient extends RabbitMQClient
  fleetClient: null
  constructor: ->
    super(JoukouConductorExchange, JoukouConductorRoutingKey)
    client = this
    this.consume( (err, message) ->
      if err
        throw err
      client.onMessage.apply(client, [message])
    , yes)
    this.fleetClient = fleet.getClient(
      JoukouFleetAPIHost,
      JoukouFleetAPIPath,
      yes
    )
  onMessage: (message) ->
    # this should stop the process
    # Here we must process what the peeps
    # want their graphs to do
    # Here is an example of messages from Isaac:
    # {
    #  "_links": {
    #    "joukou:graph": {
    #      "href":
    #         "http://api.joukou.local:2101/persona/personaUuid/graph/graphUuid"
    #    }
    #  },
    #  "desiredState": "launched", // or "inactive"
    #  "secret": "json-web-token",
    #  // Additional - Fabian
    #  "exchange": "exchange"
    #}
    # No one is listening for errors so just return
    # if there is something missing
    if message not instanceof Object
      return
    if message["_links"] not instanceof Object
      return
    if message["_links"]["joukou:graph"] not instanceof Object
      return
    if not message["_links"]["joukou:graph"]["href"]
      return
    if not message.desiredState
      return
    #May be a public graph, we will try without this
    #if not message.secret
    #  return
    this.onGraphHref(
      message["_links"]["joukou:graph"]["href"],
      message.desiredState,
      message.secret,
      message.exchange
    )
  onGraphHref: (graphHref, desiredState, secret, exchange) ->
    options = null
    if secret
      options =
        auth:
          # https://github.com/request/request#http-authentication
          bearer: secret
    client = this
    graphDeferred = Q.defer()
    graph = null
    request.get(graphHref, options, (error, response, body, desiredState) ->
      graph = client.onGraphResponse.apply(client, [
        error,
        response,
        body,
        desiredState,
        graphDeferred
      ])
    )
    # At the same time we should be creating the exchange
    createExchangePromise = httpClient.createExchange(
      exchange,
      null, # Default
      'direct',
      yes,
      yes
    )
    Q.all([
      graphDeferred.promise,
      createExchangePromise
    ]).then(->
      createUnit(graph, exchange)
    )
  createUnit: (body, exchange) ->
    ###
      unitName: "name"
      options: [SystemDUnitFile].options
      machineID: machineID
    ###
    noflo.createFromSchema(
      body,
      null, # TODO machineID
      "TODO", # TODO joukouMessageQueAddress ENV
      "TODO", # TODO joukouApiAddress ENV
      exchange
    )
    client = this.fleetClient
    client.createUnit(
      options.unitName,
      options.options,
      null,
      options.machineID
    )
  onGraphResponse: (error, response, body, graphDeferred) ->
    if error or response.statusCode isnt 200
      graphDeferred.reject()
      return
    jsonBody = null
    try
      jsonBody = JSON.parse(body)
    if not jsonBody
      graphDeferred.reject()
      return
    try
      graphDeferred.resolve()
      return jsonBody
    catch
      graphDeferred.reject()
module.exports =
  listen: ->
    new ConductorRabbitMQClient()
  ConductorRabbitMQClient: ConductorRabbitMQClient

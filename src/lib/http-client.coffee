request = require('request')
Q       = require('q')

createExchange = (name,
                  virtualHost,
                  type,
                  auto_delete,
                  durable) ->
  if typeof name isnt 'string'
    return Q.reject(new Error('Name is required to be a string'))
  if typeof virtualHost isnt 'string'
    virtualHost = "%2f"
  if typeof virtualHost isnt 'string'
    type = "direct"
  if typeof virtualHost isnt 'boolean'
    auto_delete = no
  if typeof durable isnt 'boolean'
    durable = yes
  deferred = Q.defer()
  request(
    json: yes
    method: "PUT"
    url: ""
    body:
      type: type
      auto_delete: auto_delete
      durable: durable
  , (error, response, body) ->
    onCreateExchangeResponse(error, response, body, deferred)
  )
  deferred.promise
onCreateExchangeResponse = (error, response, body, deferred) ->
  if not err and (response.statusCode < 200 or response.statusCode >= 300)
    err = new Error("Status code returned #{response.statusCode}")
  if err
    deferred.reject(err)
    return
  deferred.resolve()

module.exports =
  createExchange: createExchange
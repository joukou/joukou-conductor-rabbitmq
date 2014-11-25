RabbitMQClient          = require('./lib/client')
ConductorRabbitMQClient = require('./lib/conductor-client')


module.exports =
  RabbitMQClient: RabbitMQClient
  ConductorRabbitMQClient: ConductorRabbitMQClient
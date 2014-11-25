var ConductorRabbitMQClient, JoukouConductorExchange, JoukouConductorRoutingKey, JoukouFleetAPIHost, JoukouFleetAPIPath, RabbitMQClient, fleet, httpClient, noflo, request,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JoukouConductorExchange = process.env["JOUKOU_CONDUCTOR_EXCHANGE"];

JoukouConductorRoutingKey = process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"];

JoukouFleetAPIHost = process.env["JOUKOU_FLEET_API_HOST"];

JoukouFleetAPIPath = process.env["JOUKOU_FLEET_API_PATH"];

RabbitMQClient = require('./client');

request = require('request');

fleet = require('joukou-conductor-fleet');

noflo = require('joukou-conductor-noflo').SystemD;

httpClient = require('./http-client');

if (!JoukouConductorExchange) {
  JoukouConductorExchange = "amqp://localhost";
  process.env["JOUKOU_CONDUCTOR_EXCHANGE"] = JoukouConductorExchange;
}

if (!JoukouConductorRoutingKey) {
  JoukouConductorRoutingKey = "CONDUCTOR";
  process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"] = JoukouConductorRoutingKey;
}

if (!JoukouFleetAPIHost) {
  JoukouFleetAPIHost = "localhost:4002";
  process.env["JOUKOU_FLEET_API_HOST"] = JoukouFleetAPIHost;
}

if (!JoukouFleetAPIPath) {
  JoukouFleetAPIPath = "/v1-alpha/";
  process.env["JOUKOU_FLEET_API_PATH"] = JoukouFleetAPIPath;
}

ConductorRabbitMQClient = (function(_super) {
  __extends(ConductorRabbitMQClient, _super);

  ConductorRabbitMQClient.prototype.fleetClient = null;

  function ConductorRabbitMQClient() {
    var client;
    ConductorRabbitMQClient.__super__.constructor.call(this, JoukouConductorExchange, JoukouConductorRoutingKey);
    client = this;
    this.consume(function() {
      return client.onMessage.apply(client, arguments);
    }, true);
    this.fleetClient = fleet.getClient(JoukouFleetAPIHost, JoukouFleetAPIPath, true);
  }

  ConductorRabbitMQClient.prototype.onMessage = function(message) {
    if (!(message instanceof Object)) {
      return;
    }
    if (!(message["_links"] instanceof Object)) {
      return;
    }
    if (!(message["_links"]["joukou:graph"] instanceof Object)) {
      return;
    }
    if (!message["_links"]["joukou:graph"]["href"]) {
      return;
    }
    if (!message.desiredState) {
      return;
    }
    return this.onGraphHref(message["_links"]["joukou:graph"]["href"], message.desiredState, message.secret, message.exchange);
  };

  ConductorRabbitMQClient.prototype.onGraphHref = function(graphHref, desiredState, secret, exchange) {
    var client, createExchangePromise, graph, graphDeferred, options;
    options = null;
    if (secret) {
      options = {
        auth: {
          bearer: secret
        }
      };
    }
    client = this;
    graphDeferred = Q.defer();
    graph = null;
    request.get(graphHref, options, function(error, response, body, desiredState) {
      return graph = client.onGraphResponse.apply(client, [error, response, body, desiredState, graphDeferred]);
    });
    createExchangePromise = httpClient.createExchange(exchange, null, 'direct', true, true);
    return Q.all([graphDeferred.promise, createExchangePromise]).then(function() {
      return createUnit(graph, exchange);
    });
  };

  ConductorRabbitMQClient.prototype.createUnit = function(body, exchange) {

    /*
      unitName: "name"
      options: [SystemDUnitFile].options
      machineID: machineID
     */
    var client;
    noflo.createFromSchema(body, null, "TODO", "TODO", exchange);
    client = this.fleetClient;
    return client.createUnit(options.unitName, options.options, null, options.machineID);
  };

  ConductorRabbitMQClient.prototype.onGraphResponse = function(error, response, body, graphDeferred) {
    var jsonBody;
    if (error || response.statusCode !== 200) {
      graphDeferred.reject();
      return;
    }
    jsonBody = null;
    try {
      jsonBody = JSON.parse(body);
    } catch (_error) {}
    if (!jsonBody) {
      graphDeferred.reject();
      return;
    }
    try {
      graphDeferred.resolve();
      return jsonBody;
    } catch (_error) {
      return graphDeferred.reject();
    }
  };

  return ConductorRabbitMQClient;

})(RabbitMQClient);

module.exports = {
  listen: function() {
    return new ConductorRabbitMQClient();
  },
  ConductorRabbitMQClient: ConductorRabbitMQClient
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb25kdWN0b3ItY2xpZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLHNLQUFBO0VBQUE7aVNBQUE7O0FBQUEsdUJBQUEsR0FBNEIsT0FBTyxDQUFDLEdBQUksQ0FBQSwyQkFBQSxDQUF4QyxDQUFBOztBQUFBLHlCQUNBLEdBQTRCLE9BQU8sQ0FBQyxHQUFJLENBQUEsOEJBQUEsQ0FEeEMsQ0FBQTs7QUFBQSxrQkFHQSxHQUE0QixPQUFPLENBQUMsR0FBSSxDQUFBLHVCQUFBLENBSHhDLENBQUE7O0FBQUEsa0JBSUEsR0FBNEIsT0FBTyxDQUFDLEdBQUksQ0FBQSx1QkFBQSxDQUp4QyxDQUFBOztBQUFBLGNBTUEsR0FBNEIsT0FBQSxDQUFRLFVBQVIsQ0FONUIsQ0FBQTs7QUFBQSxPQU9BLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLENBUDVCLENBQUE7O0FBQUEsS0FRQSxHQUE0QixPQUFBLENBQVEsd0JBQVIsQ0FSNUIsQ0FBQTs7QUFBQSxLQVNBLEdBQTRCLE9BQUEsQ0FBUSx3QkFBUixDQUFpQyxDQUFDLE9BVDlELENBQUE7O0FBQUEsVUFVQSxHQUE0QixPQUFBLENBQVEsZUFBUixDQVY1QixDQUFBOztBQWNBLElBQUcsQ0FBQSx1QkFBSDtBQUNFLEVBQUEsdUJBQUEsR0FBMEIsa0JBQTFCLENBQUE7QUFBQSxFQUNBLE9BQU8sQ0FBQyxHQUFJLENBQUEsMkJBQUEsQ0FBWixHQUEyQyx1QkFEM0MsQ0FERjtDQWRBOztBQWtCQSxJQUFHLENBQUEseUJBQUg7QUFDRSxFQUFBLHlCQUFBLEdBQTRCLFdBQTVCLENBQUE7QUFBQSxFQUNBLE9BQU8sQ0FBQyxHQUFJLENBQUEsOEJBQUEsQ0FBWixHQUE4Qyx5QkFEOUMsQ0FERjtDQWxCQTs7QUFzQkEsSUFBRyxDQUFBLGtCQUFIO0FBQ0UsRUFBQSxrQkFBQSxHQUFxQixnQkFBckIsQ0FBQTtBQUFBLEVBQ0EsT0FBTyxDQUFDLEdBQUksQ0FBQSx1QkFBQSxDQUFaLEdBQXVDLGtC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QUNFLE1BQUEsYUFBYSxDQUFDLE9BQWQsQ0FBQSxDQUFBLENBQUE7QUFDQSxhQUFPLFFBQVAsQ0FGRjtLQUFBLGNBQUE7YUFJRSxhQUFhLENBQUMsTUFBZCxDQUFBLEVBSkY7S0FWZTtFQUFBLENBdEdqQixDQUFBOztpQ0FBQTs7R0FEb0MsZUE5QnRDLENBQUE7O0FBQUEsTUFvSk0sQ0FBQyxPQUFQLEdBQ0U7QUFBQSxFQUFBLE1BQUEsRUFBUSxTQUFBLEdBQUE7V0FDRixJQUFBLHVCQUFBLENBQUEsRUFERTtFQUFBLENBQVI7QUFBQSxFQUVBLHVCQUFBLEVBQXlCLHVCQUZ6QjtDQXJKRixDQUFBIiwiZmlsZSI6ImxpYi9jb25kdWN0b3ItY2xpZW50LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiSm91a291Q29uZHVjdG9yRXhjaGFuZ2UgICA9IHByb2Nlc3MuZW52W1wiSk9VS09VX0NPTkRVQ1RPUl9FWENIQU5HRVwiXVxuSm91a291Q29uZHVjdG9yUm91dGluZ0tleSA9IHByb2Nlc3MuZW52W1wiSk9VS09VX0NPTkRVQ1RPUl9ST1VUSU5HX0tFWVwiXVxuXG5Kb3Vrb3VGbGVldEFQSUhvc3QgICAgICAgID0gcHJvY2Vzcy5lbnZbXCJKT1VLT1VfRkxFRVRfQVBJX0hPU1RcIl1cbkpvdWtvdUZsZWV0QVBJUGF0aCAgICAgICAgPSBwcm9jZXNzLmVudltcIkpPVUtPVV9GTEVFVF9BUElfUEFUSFwiXVxuXG5SYWJiaXRNUUNsaWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnLi9jbGllbnQnKVxucmVxdWVzdCAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ3JlcXVlc3QnKVxuZmxlZXQgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2pvdWtvdS1jb25kdWN0b3ItZmxlZXQnKVxubm9mbG8gICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2pvdWtvdS1jb25kdWN0b3Itbm9mbG8nKS5TeXN0ZW1EXG5odHRwQ2xpZW50ICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9odHRwLWNsaWVudCcpXG5cbiMgU2V0IHRoZSBFTlYgdmFyaWFibGUgZm9yIG5leHQgdGltZVxuIyBUaGlzIGRvZXMgbm90IGVmZmVjdCBnbG9iYWwgZW52IGp1c3QgdGhpcyBwcm9jZXNzXG5pZiBub3QgSm91a291Q29uZHVjdG9yRXhjaGFuZ2VcbiAgSm91a291Q29uZHVjdG9yRXhjaGFuZ2UgPSBcImFtcXA6Ly9sb2NhbGhvc3RcIlxuICBwcm9jZXNzLmVudltcIkpPVUtPVV9DT05EVUNUT1JfRVhDSEFOR0VcIl0gPSBKb3Vrb3VDb25kdWN0b3JFeGNoYW5nZVxuXG5pZiBub3QgSm91a291Q29uZHVjdG9yUm91dGluZ0tleVxuICBKb3Vrb3VDb25kdWN0b3JSb3V0aW5nS2V5ID0gXCJDT05EVUNUT1JcIlxuICBwcm9jZXNzLmVudltcIkpPVUtPVV9DT05EVUNUT1JfUk9VVElOR19LRVlcIl0gPSBKb3Vrb3VDb25kdWN0b3JSb3V0aW5nS2V5XG5cbmlmIG5vdCBKb3Vrb3VGbGVldEFQSUhvc3RcbiAgSm91a291RmxlZXRBUElIb3N0ID0gXCJsb2NhbGhvc3Q6NDAwMlwiXG4gIHByb2Nlc3MuZW52W1wiSk9VS09VX0ZMRUVUX0FQSV9IT1NUXCJdID0gSm91a291RmxlZXRBUElIb3N0XG5cbmlmIG5vdCBKb3Vrb3VGbGVldEFQSVBhdGhcbiAgSm91a291RmxlZXRBUElQYXRoID0gXCIvdjEtYWxwaGEvXCJcbiAgcHJvY2Vzcy5lbnZbXCJKT1VLT1VfRkxFRVRfQVBJX1BBVEhcIl0gPSBKb3Vrb3VGbGVldEFQSVBhdGhcblxuY2xhc3MgQ29uZHVjdG9yUmFiYml0TVFDbGllbnQgZXh0ZW5kcyBSYWJiaXRNUUNsaWVudFxuICBmbGVldENsaWVudDogbnVsbFxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlcihKb3Vrb3VDb25kdWN0b3JFeGNoYW5nZSwgSm91a291Q29uZHVjdG9yUm91dGluZ0tleSlcbiAgICBjbGllbnQgPSB0aGlzXG4gICAgdGhpcy5jb25zdW1lKCAtPlxuICAgICAgY2xpZW50Lm9uTWVzc2FnZS5hcHBseShjbGllbnQsIGFyZ3VtZW50cylcbiAgICAsIHllcylcbiAgICB0aGlzLmZsZWV0Q2xpZW50ID0gZmxlZXQuZ2V0Q2xpZW50KFxuICAgICAgSm91a291RmxlZXRBUElIb3N0LFxuICAgICAgSm91a291RmxlZXRBUElQYXRoLFxuICAgICAgeWVzXG4gICAgKVxuICBvbk1lc3NhZ2U6IChtZXNzYWdlKSAtPlxuICAgICMgSGVyZSB3ZSBtdXN0IHByb2Nlc3Mgd2hhdCB0aGUgcGVlcHNcbiAgICAjIHdhbnQgdGhlaXIgZ3JhcGhzIHRvIGRvXG4gICAgIyBIZXJlIGlzIGFuIGV4YW1wbGUgb2YgbWVzc2FnZXMgZnJvbSBJc2FhYzpcbiAgICAjIHtcbiAgICAjICBcIl9saW5rc1wiOiB7XG4gICAgIyAgICBcImpvdWtvdTpncmFwaFwiOiB7XG4gICAgIyAgICAgIFwiaHJlZlwiOlxuICAgICMgICAgICAgICBcImh0dHA6Ly9hcGkuam91a291LmxvY2FsOjIxMDEvcGVyc29uYS9wZXJzb25hVXVpZC9ncmFwaC9ncmFwaFV1aWRcIlxuICAgICMgICAgfVxuICAgICMgIH0sXG4gICAgIyAgXCJkZXNpcmVkU3RhdGVcIjogXCJsYXVuY2hlZFwiLCAvLyBvciBcImluYWN0aXZlXCJcbiAgICAjICBcInNlY3JldFwiOiBcImpzb24td2ViLXRva2VuXCIsXG4gICAgIyAgLy8gQWRkaXRpb25hbCAtIEZhYmlhblxuICAgICMgIFwiZXhjaGFuZ2VcIjogXCJleGNoYW5nZVwiXG4gICAgI31cbiAgICAjIE5vIG9uZSBpcyBsaXN0ZW5pbmcgZm9yIGVycm9ycyBzbyBqdXN0IHJldHVyblxuICAgICMgaWYgdGhlcmUgaXMgc29tZXRoaW5nIG1pc3NpbmdcbiAgICBpZiBtZXNzYWdlIG5vdCBpbnN0YW5jZW9mIE9iamVjdFxuICAgICAgcmV0dXJuXG4gICAgaWYgbWVzc2FnZVtcIl9saW5rc1wiXSBub3QgaW5zdGFuY2VvZiBPYmplY3RcbiAgICAgIHJldHVyblxuICAgIGlmIG1lc3NhZ2VbXCJfbGlua3NcIl1bXCJqb3Vrb3U6Z3JhcGhcIl0gbm90IGluc3RhbmNlb2YgT2JqZWN0XG4gICAgICByZXR1cm5cbiAgICBpZiBub3QgbWVzc2FnZVtcIl9saW5rc1wiXVtcImpvdWtvdTpncmFwaFwiXVtcImhyZWZcIl1cbiAgICAgIHJldHVyblxuICAgIGlmIG5vdCBtZXNzYWdlLmRlc2lyZWRTdGF0ZVxuICAgICAgcmV0dXJuXG4gICAgI01heSBiZSBhIHB1YmxpYyBncmFwaCwgd2Ugd2lsbCB0cnkgd2l0aG91dCB0aGlzXG4gICAgI2lmIG5vdCBtZXNzYWdlLnNlY3JldFxuICAgICMgIHJldHVyblxuICAgIHRoaXMub25HcmFwaEhyZWYoXG4gICAgICBtZXNzYWdlW1wiX2xpbmtzXCJdW1wiam91a291OmdyYXBoXCJdW1wiaHJlZlwiXSxcbiAgICAgIG1lc3NhZ2UuZGVzaXJlZFN0YXRlLFxuICAgICAgbWVzc2FnZS5zZWNyZXQsXG4gICAgICBtZXNzYWdlLmV4Y2hhbmdlXG4gICAgKVxuICBvbkdyYXBoSHJlZjogKGdyYXBoSHJlZiwgZGVzaXJlZFN0YXRlLCBzZWNyZXQsIGV4Y2hhbmdlKSAtPlxuICAgIG9wdGlvbnMgPSBudWxsXG4gICAgaWYgc2VjcmV0XG4gICAgICBvcHRpb25zID1cbiAgICAgICAgYXV0aDpcbiAgICAgICAgICAjIGh0dHBzOi8vZ2l0aHViLmNvbS9yZXF1ZXN0L3JlcXVlc3QjaHR0cC1hdXRoZW50aWNhdGlvblxuICAgICAgICAgIGJlYXJlcjogc2VjcmV0XG4gICAgY2xpZW50ID0gdGhpc1xuICAgIGdyYXBoRGVmZXJyZWQgPSBRLmRlZmVyKClcbiAgICBncmFwaCA9IG51bGxcbiAgICByZXF1ZXN0LmdldChncmFwaEhyZWYsIG9wdGlvbnMsIChlcnJvciwgcmVzcG9uc2UsIGJvZHksIGRlc2lyZWRTdGF0ZSkgLT5cbiAgICAgIGdyYXBoID0gY2xpZW50Lm9uR3JhcGhSZXNwb25zZS5hcHBseShjbGllbnQsIFtcbiAgICAgICAgZXJyb3IsXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBib2R5LFxuICAgICAgICBkZXNpcmVkU3RhdGUsXG4gICAgICAgIGdyYXBoRGVmZXJyZWRcbiAgICAgIF0pXG4gICAgKVxuICAgICMgQXQgdGhlIHNhbWUgdGltZSB3ZSBzaG91bGQgYmUgY3JlYXRpbmcgdGhlIGV4Y2hhbmdlXG4gICAgY3JlYXRlRXhjaGFuZ2VQcm9taXNlID0gaHR0cENsaWVudC5jcmVhdGVFeGNoYW5nZShcbiAgICAgIGV4Y2hhbmdlLFxuICAgICAgbnVsbCwgIyBEZWZhdWx0XG4gICAgICAnZGlyZWN0JyxcbiAgICAgIHllcyxcbiAgICAgIHllc1xuICAgIClcbiAgICBRLmFsbChbXG4gICAgICBncmFwaERlZmVycmVkLnByb21pc2UsXG4gICAgICBjcmVhdGVFeGNoYW5nZVByb21pc2VcbiAgICBdKS50aGVuKC0+XG4gICAgICBjcmVhdGVVbml0KGdyYXBoLCBleGNoYW5nZSlcbiAgICApXG4gIGNyZWF0ZVVuaXQ6IChib2R5LCBleGNoYW5nZSkgLT5cbiAgICAjIyNcbiAgICAgIHVuaXROYW1lOiBcIm5hbWVcIlxuICAgICAgb3B0aW9uczogW1N5c3RlbURVbml0RmlsZV0ub3B0aW9uc1xuICAgICAgbWFjaGluZUlEOiBtYWNoaW5lSURcbiAgICAjIyNcbiAgICBub2Zsby5jcmVhdGVGcm9tU2NoZW1hKFxuICAgICAgYm9keSxcbiAgICAgIG51bGwsICMgVE9ETyBtYWNoaW5lSURcbiAgICAgIFwiVE9ET1wiLCAjIFRPRE8gam91a291TWVzc2FnZVF1ZUFkZHJlc3MgRU5WXG4gICAgICBcIlRPRE9cIiwgIyBUT0RPIGpvdWtvdUFwaUFkZHJlc3MgRU5WXG4gICAgICBleGNoYW5nZVxuICAgIClcbiAgICBjbGllbnQgPSB0aGlzLmZsZWV0Q2xpZW50XG4gICAgY2xpZW50LmNyZWF0ZVVuaXQoXG4gICAgICBvcHRpb25zLnVuaXROYW1lLFxuICAgICAgb3B0aW9ucy5vcHRpb25zLFxuICAgICAgbnVsbCxcbiAgICAgIG9wdGlvbnMubWFjaGluZUlEXG4gICAgKVxuICBvbkdyYXBoUmVzcG9uc2U6IChlcnJvciwgcmVzcG9uc2UsIGJvZHksIGdyYXBoRGVmZXJyZWQpIC0+XG4gICAgaWYgZXJyb3Igb3IgcmVzcG9uc2Uuc3RhdHVzQ29kZSBpc250IDIwMFxuICAgICAgZ3JhcGhEZWZlcnJlZC5yZWplY3QoKVxuICAgICAgcmV0dXJuXG4gICAganNvbkJvZHkgPSBudWxsXG4gICAgdHJ5XG4gICAgICBqc29uQm9keSA9IEpTT04ucGFyc2UoYm9keSlcbiAgICBpZiBub3QganNvbkJvZHlcbiAgICAgIGdyYXBoRGVmZXJyZWQucmVqZWN0KClcbiAgICAgIHJldHVyblxuICAgIHRyeVxuICAgICAgZ3JhcGhEZWZlcnJlZC5yZXNvbHZlKClcbiAgICAgIHJldHVybiBqc29uQm9keVxuICAgIGNhdGNoXG4gICAgICBncmFwaERlZmVycmVkLnJlamVjdCgpXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGxpc3RlbjogLT5cbiAgICBuZXcgQ29uZHVjdG9yUmFiYml0TVFDbGllbnQoKVxuICBDb25kdWN0b3JSYWJiaXRNUUNsaWVudDogQ29uZHVjdG9yUmFiYml0TVFDbGllbnRcbiJdfQ==
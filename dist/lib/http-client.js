var Q, createExchange, onCreateExchangeResponse, request;

request = require('request');

Q = require('q');

createExchange = function(name, virtualHost, type, auto_delete, durable) {
  var deferred;
  if (typeof name !== 'string') {
    return Q.reject(new Error('Name is required to be a string'));
  }
  if (typeof virtualHost !== 'string') {
    virtualHost = "%2f";
  }
  if (typeof virtualHost !== 'string') {
    type = "direct";
  }
  if (typeof virtualHost !== 'boolean') {
    auto_delete = false;
  }
  if (typeof durable !== 'boolean') {
    durable = true;
  }
  deferred = Q.defer();
  request({
    json: true,
    method: "PUT",
    url: "",
    body: {
      type: type,
      auto_delete: auto_delete,
      durable: durable
    }
  }, function(error, response, body) {
    return onCreateExchangeResponse(error, response, body, deferred);
  });
  return deferred.promise;
};

onCreateExchangeResponse = function(error, response, body, deferred) {
  var err;
  if (!err && (response.statusCode < 200 || response.statusCode >= 300)) {
    err = new Error("Status code returned " + response.statusCode);
  }
  if (err) {
    deferred.reject(err);
    return;
  }
  return deferred.resolve();
};

module.exports = {
  createExchange: createExchange
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9odHRwLWNsaWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxvREFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVIsQ0FBVixDQUFBOztBQUFBLENBQ0EsR0FBVSxPQUFBLENBQVEsR0FBUixDQURWLENBQUE7O0FBQUEsY0FHQSxHQUFpQixTQUFDLElBQUQsRUFDQyxXQURELEVBRUMsSUFGRCxFQUdDLFdBSEQsRUFJQyxPQUpELEdBQUE7QUFLZixNQUFBLFFBQUE7QUFBQSxFQUFBLElBQUcsTUFBQSxDQUFBLElBQUEsS0FBaUIsUUFBcEI7QUFDRSxXQUFPLENBQUMsQ0FBQyxNQUFGLENBQWEsSUFBQSxLQUFBLENBQU0saUNBQU4sQ0FBYixDQUFQLENBREY7R0FBQTtBQUVBLEVBQUEsSUFBRyxNQUFBLENBQUEsV0FBQSxLQUF3QixRQUEzQjtBQUNFLElBQUEsV0FBQSxHQUFjLEtBQWQsQ0FERjtHQUZBO0FBSUEsRUFBQSxJQUFHLE1BQUEsQ0FBQSxXQUFBLEtBQXdCLFFBQTNCO0FBQ0UsSUFBQSxJQUFBLEdBQU8sUUFBUCxDQURGO0dBSkE7QUFNQSxFQUFBLElBQUcsTUFBQSxDQUFBLFdBQUEsS0FBd0IsU0FBM0I7QUFDRSxJQUFBLFdBQUEsR0FBYyxLQUFkLENBREY7R0FOQTtBQVFBLEVBQUEsSUFBRyxNQUFBLENBQUEsT0FBQSxLQUFvQixTQUF2QjtBQUNFLElBQUEsT0FBQSxHQUFVLElBQVYsQ0FERjtHQVJBO0FBQUEsRUFVQSxRQUFBLEdBQVcsQ0FBQyxDQUFDLEtBQUYsQ0FBQSxDQVZYLENBQUE7QUFBQSxFQVdBLE9BQUEsQ0FDRTtBQUFBLElBQUEsSUFBQSxFQUFNLElBQU47QUFBQSxJQUNBLE1BQUEsRUFBUSxLQURSO0FBQUEsSUFFQSxHQUFBLEVBQUssRUFGTDtBQUFBLElBR0EsSUFBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sSUFBTjtBQUFBLE1BQ0EsV0FBQSxFQUFhLFdBRGI7QUFBQSxNQUVBLE9BQUEsRUFBUyxPQUZUO0tBSkY7R0FERixFQVFFLFNBQUMsS0FBRCxFQUFRLFFBQVIsRUFBa0IsSUFBbEIsR0FBQTtXQUNBLHdCQUFBLENBQXlCLEtBQXpCLEVBQWdDLFFBQWhDLEVBQTBDLElBQTFDLEVBQWdELFFBQWhELEVBREE7RUFBQSxDQVJGLENBWEEsQ0FBQTtTQXNCQSxRQUFRLENBQUMsUUEzQk07QUFBQSxDQUhqQixDQUFBOztBQUFBLHdCQStCQSxHQUEyQixTQUFDLEtBQUQsRUFBUSxRQUFSLEVBQWtCLElBQWxCLEVBQXdCLFFBQXhCLEdBQUE7QUFDekIsTUFBQSxHQUFBO0FBQUEsRUFBQSxJQUFHLENBQUEsR0FBQSxJQUFZLENBQUMsUUFBUSxDQUFDLFVBQVQsR0FBc0IsR0FBdEIsSUFBNkIsUUFBUSxDQUFDLFVBQVQsSUFBdUIsR0FBckQsQ0FBZjtBQUNFLElBQUEsR0FBQSxHQUFVLElBQUEsS0FBQSxDQUFPLHVCQUFBLEdBQXVCLFFBQVEsQ0FBQyxVQUF2QyxDQUFWLENBREY7R0FBQTtBQUVBLEVBQUEsSUFBRyxHQUFIO0FBQ0UsSUFBQSxRQUFRLENBQUMsTUFBVCxDQUFnQixHQUFoQixDQUFBLENBQUE7QUFDQSxVQUFBLENBRkY7R0FGQTtTQUtBLFFBQVEsQ0FBQyxPQUFULENBQUEsRUFOeUI7QUFBQSxDQS9CM0IsQ0FBQTs7QUFBQSxNQXVDTSxDQUFDLE9BQVAsR0FDRTtBQUFBLEVBQUEsY0FBQSxFQUFnQixjQUFoQjtDQXhDRixDQUFBIiwiZmlsZSI6ImxpYi9odHRwLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0JylcblEgICAgICAgPSByZXF1aXJlKCdxJylcblxuY3JlYXRlRXhjaGFuZ2UgPSAobmFtZSxcbiAgICAgICAgICAgICAgICAgIHZpcnR1YWxIb3N0LFxuICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgIGF1dG9fZGVsZXRlLFxuICAgICAgICAgICAgICAgICAgZHVyYWJsZSkgLT5cbiAgaWYgdHlwZW9mIG5hbWUgaXNudCAnc3RyaW5nJ1xuICAgIHJldHVybiBRLnJlamVjdChuZXcgRXJyb3IoJ05hbWUgaXMgcmVxdWlyZWQgdG8gYmUgYSBzdHJpbmcnKSlcbiAgaWYgdHlwZW9mIHZpcnR1YWxIb3N0IGlzbnQgJ3N0cmluZydcbiAgICB2aXJ0dWFsSG9zdCA9IFwiJTJmXCJcbiAgaWYgdHlwZW9mIHZpcnR1YWxIb3N0IGlzbnQgJ3N0cmluZydcbiAgICB0eXBlID0gXCJkaXJlY3RcIlxuICBpZiB0eXBlb2YgdmlydHVhbEhvc3QgaXNudCAnYm9vbGVhbidcbiAgICBhdXRvX2RlbGV0ZSA9IG5vXG4gIGlmIHR5cGVvZiBkdXJhYmxlIGlzbnQgJ2Jvb2xlYW4nXG4gICAgZHVyYWJsZSA9IHllc1xuICBkZWZlcnJlZCA9IFEuZGVmZXIoKVxuICByZXF1ZXN0KFxuICAgIGpzb246IHllc1xuICAgIG1ldGhvZDogXCJQVVRcIlxuICAgIHVybDogXCJcIlxuICAgIGJvZHk6XG4gICAgICB0eXBlOiB0eXBlXG4gICAgICBhdXRvX2RlbGV0ZTogYXV0b19kZWxldGVcbiAgICAgIGR1cmFibGU6IGR1cmFibGVcbiAgLCAoZXJyb3IsIHJlc3BvbnNlLCBib2R5KSAtPlxuICAgIG9uQ3JlYXRlRXhjaGFuZ2VSZXNwb25zZShlcnJvciwgcmVzcG9uc2UsIGJvZHksIGRlZmVycmVkKVxuICApXG4gIGRlZmVycmVkLnByb21pc2Vcbm9uQ3JlYXRlRXhjaGFuZ2VSZXNwb25zZSA9IChlcnJvciwgcmVzcG9uc2UsIGJvZHksIGRlZmVycmVkKSAtPlxuICBpZiBub3QgZXJyIGFuZCAocmVzcG9uc2Uuc3RhdHVzQ29kZSA8IDIwMCBvciByZXNwb25zZS5zdGF0dXNDb2RlID49IDMwMClcbiAgICBlcnIgPSBuZXcgRXJyb3IoXCJTdGF0dXMgY29kZSByZXR1cm5lZCAje3Jlc3BvbnNlLnN0YXR1c0NvZGV9XCIpXG4gIGlmIGVyclxuICAgIGRlZmVycmVkLnJlamVjdChlcnIpXG4gICAgcmV0dXJuXG4gIGRlZmVycmVkLnJlc29sdmUoKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNyZWF0ZUV4Y2hhbmdlOiBjcmVhdGVFeGNoYW5nZSJdfQ==
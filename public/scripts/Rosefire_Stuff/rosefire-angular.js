angular
  .module('rosefire', [])
  .service('Rosefire', ['$window', '$q', '$rootScope', function($window, $q, $rootScope) {
    this.signIn = function(registryToken) {
      var deferred = $q.defer();
      $window.Rosefire.signIn(registryToken, function(err, token) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(token);
        }
        $rootScope.$apply();
      });
      return deferred.promise;
    };
  }]);

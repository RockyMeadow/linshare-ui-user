/**
 * Authentication service
 * @namespace LinShare.authentication
 */
(function() {
  'use strict';
  angular
    .module('linshare.authentication')
    .factory('authenticationRestService', authenticationRestService);

  authenticationRestService.$inject = [
    '$state',
    '_',
    '$location',
    '$log',
    '$q',
    '$window',
    'authService',
    'lsAppConfig',
    'oidcService',
    'Restangular',
    'ServerManagerService',
    'toastService',
    'authenticationUtilsService'
  ];

  /**
   * @namespace authenticationRestService
   * @desc Service to interact with User Authentication object by REST
   * @memberOf Linshare.authentication
   */
  function authenticationRestService(
    $state,
    _,
    $location,
    $log,
    $q,
    $window,
    authService,
    lsAppConfig,
    oidcService,
    Restangular,
    ServerManagerService,
    toastService,
    authenticationUtilsService
  ) {
    var
      deferred = $q.defer(),
      handler = ServerManagerService.responseHandler,
      restUrl = 'authentication',
      service = {
        checkAuthentication: checkAuthentication,
        getCurrentUser: getCurrentUser,
        login: login,
        loginWithAccessToken: loginWithAccessToken,
        logout: logout,
        version: version
      };

    return service;

    ////////////

    /**
     * @name checkAuthentication
     * @desc Check user authorization
     * @param {boolean} hideError - Determine if the error shall be hidden to the user
     * @param {boolean} ignoreAuthModule - Determine if the auth module should be ignored
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function checkAuthentication(hideError, ignoreAuthModule) {
      $log.debug('AuthenticationRestService : checkAuthentication');

      return handler(Restangular.all(restUrl).withHttpConfig({
        ignoreAuthModule: ignoreAuthModule
      }).customGET('authorized'), undefined, hideError)
        .then(function(userLoggedIn) {
          deferred.resolve(userLoggedIn);

          return (userLoggedIn);
        }).catch(function(error) {
          deferred.reject(error);
          $log.debug('current user not authenticated', error);

          return error;
        });
    }

    /**
     * @name getCurrentUser
     * @desc get the current user connected
     * @return {Promise}
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function getCurrentUser() {
      $log.debug('AuthenticationRestService : getCurrentUser');

      return deferred.promise;
    }

    /**
     * @name login
     * @desc Login system of the App
     * @param {string} login - Login of the user
     * @param {string} password - Password of the user
     * @param {string} otp - 6 digits of code for second factor authentication
     * @return {Promise} server response
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function login(login, password, otp) {
      deferred = $q.defer();
      $log.debug('AuthenticationRestService : login');

      var headers = authenticationUtilsService.buildHeader(login, password, otp);
      var action = Restangular.all(restUrl)
        .withHttpConfig({ ignoreAuthModule: true })
        .customGET('authorized', {}, headers);

      handler(action, null, true).then(function(user) {
        authService.loginConfirmed(user);

        return deferred.resolve(user);
      }).catch(function(error) {
        var foundError = authenticationUtilsService.findError(error);

        if (foundError) {
          toastService[foundError.notificationType]({ key: foundError.message });

          if (foundError.code === '1002') {
            return $state.go('secondFactorAuthenticationLogin', {
              loginInfo: { login: login, password: password }
            });
          }
        }

        return deferred.reject(foundError);
      });

      return deferred.promise;
    }

    /**
     * @name loginWithAccessToken
     * @desc Login with access token of the App
     * @param {string} token - Access token of the user
     * @return {Promise} server response
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function loginWithAccessToken(token) {
      deferred = $q.defer();
      $log.debug('AuthenticationRestService : loginSSO');

      const headers = authenticationUtilsService.buildBearerTokenHeader(token);
      const action = Restangular.all(restUrl)
        .withHttpConfig({ ignoreAuthModule: true })
        .customGET('authorized', {}, headers);

      handler(action, null, true).then(user => {
        authService.loginConfirmed(user);

        return deferred.resolve(user);
      }).catch(error => {
        const foundError = authenticationUtilsService.findError(error);

        if (foundError) {
          toastService[foundError.notificationType]({ key: foundError.message });
        }

        return deferred.reject(foundError);
      });

      return deferred.promise;
    }

    /**
     * @name logout
     * @desc Logout system of the App
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function logout() {
      $log.debug('AuthenticationRestService : logout');

      $q.all([
        getCurrentUser(),
        ServerManagerService.getHeaders(),
        handler(Restangular.all(restUrl).withHttpConfig().customGET('logout'))
      ])
        .then(([loggedUser, headers]) => {
          const headersLogoutUrl = headers['x-linshare-post-logout-url'];
          let location;

          if (loggedUser.authWithOIDC) {
            $log.debug('AuthenticationRestService : logout - Initiate logout for OIDC authenticated user');

            return oidcService.signOut();
          }

          if (headersLogoutUrl) {
            if (_.startsWith(headersLogoutUrl, 'http')) {
              $log.debug('AuthenticationRestService : logout - Using X-LINSHARE-POST-LOGOUT-URL for redirection');
              location = headersLogoutUrl;
            }
          }
          if (_.isUndefined(location) && lsAppConfig.postLogoutUrl) {
            $log.debug('AuthenticationRestService : logout - Using lsAppConfig.postLogoutUrl for redirection');
            location = lsAppConfig.postLogoutUrl;
          }
          if (_.isUndefined(location)) {
            $log.debug('AuthenticationRestService : logout - Using current location root for redirection');
            var absUrl = $location.absUrl();

            location = absUrl.split('#')[0];
          }

          authService.loginCancelled();
          $log.debug('Authentication logout: success');
          $window.location.href = location;
        }).catch(function(error) {
          $log.error('Authentication logout : failed', error.status);
        });
    }

    /**
     * @name version
     * @desc Get the version of the core API
     * @return {Promise} server response
     * @memberOf Linshare.authentication.authenticationRestService
     */
    function version() {
      $log.debug('AuthenticationRestService : version');

      return handler(Restangular.one(restUrl, 'version').get());
    }
  }
})();

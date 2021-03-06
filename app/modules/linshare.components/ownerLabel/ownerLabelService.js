/**
 * ownerLabel Factory
 * @namespace linshare.components
 */
(function() {
  'use strict';

  angular
    .module('linshare.components')
    .factory('ownerLabel', ownerLabel);

  ownerLabel.$inject = ['_', '$log', '$q', '$translate', 'authenticationRestService'];

  /**
   * @namespace ownerLabel
   * @desc Service to manage owner value of element
   * @memberOf NameSpaceGlobal
   */
  function ownerLabel(_, $log, $q, $translate, authenticationRestService) {
    var by,
      currentUser,
      me,
      service = {
        getOwner: getOwner
      };

    activate();

    return service;

    ////////////

    /**
     * @name activate
     * @desc Activation function of the service, launch at every instantiation
     * @memberOf linshare.components.ownerLabel
     */
    function activate() {
      $q.all([authenticationRestService.getCurrentUser(), $translate(['BY', 'ME'])]).then(function(promises) {
        currentUser = promises[0];
        by = promises[1].BY;
        me = promises[1].ME;
      }).catch(function(error) {
        $log.debug('Error on loading ownerLabel service', error);
      });
    }

    /**
     * @name getOwner
     * @desc Get the owner value of an element in the form of : 'By <first name + last name | Me>'.
     * @param {Object} user - User object containing basic info: firstName, lastName, mail.
     * @returns {string} the owner value of the element.
     * @memberOf linshare.components.ownerLabel
     */
    function getOwner(user) {
      if (_.isNil(user.mail)) {
        return _.isEqual(_.pick(currentUser, ['firstName', 'lastName']), user) ?
          by + ' ' + me : by + ' ' + user.firstName + ' ' + user.lastName;
      }
      
      return _.isEqual(_.pick(currentUser, ['firstName', 'lastName', 'mail']), user) ?
        by + ' ' + me : by + ' ' + user.firstName + ' ' + user.lastName;
    }
  }
})();

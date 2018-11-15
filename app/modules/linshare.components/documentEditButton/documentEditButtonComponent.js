/**
 * documentEditButton Component
 * @namespace linshare.components
 */
(function() {
  'use strict';

  angular
    .module('linshare.components')
    .component('documentEditButton', {
      templateUrl: templateUrl,
      controller: 'DocumentEditButtonController',
      controllerAs: 'documentEditButtonVm',
      bindings: {
        item: '<',
        editorBaseUrl: '<'
      }
    });

  /**
   * @name templateUrl
   * @desc Retrieve the URL template of the component
   * @param {ComponentsConfig} componentsConfig - Configuration object utils for components
   * @memberOf linshare.components.documentEditButton
   */
  function templateUrl(componentsConfig) {
    return componentsConfig.path + 'documentEditButton/documentEditButton.html';
  }

  templateUrl.$inject = ['componentsConfig'];
})();

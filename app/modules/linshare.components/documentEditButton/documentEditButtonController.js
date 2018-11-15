/**
 * DocumentEditButton Controller
 * @namespace linshare.components
 */
(function() {
  'use strict';

  angular
    .module('linshare.components')
    .controller('DocumentEditButtonController', DocumentEditButtonController);

  DocumentEditButtonController.$inject = [
    '$window',
    'getextensionFilter',
    'lsEditorConfig'
  ];

  function DocumentEditButtonController(
    $window,
    getextensionFilter,
    lsEditorConfig
  ) {
    var documentEditButtonVm = this;

    documentEditButtonVm.isValidFileType = isValidFileType;
    documentEditButtonVm.openEditor = openEditor;

    /**
     * @name isValidFileType
     * @desc check whether document file types is one of supported formats of editor
     * @return {Boolean} True if document file type is valid
     * @namespace linshare.components.DocumentEditButtonController
     */
    function isValidFileType() {
      return lsEditorConfig.editableExtensions.indexOf(getextensionFilter(documentEditButtonVm.item.name));
    }

    /**
     * @name openEditor
     * @desc open the editor
     * @namespace linshare.components.DocumentEditButtonController
     */
    function openEditor() {
      const editorUrl = [
        documentEditButtonVm.editorBaseUrl,
        '/#/editor/work_groups/',
        documentEditButtonVm.item.workGroup,
        '/docs/',
        documentEditButtonVm.item.uuid
      ].join('');

      $window.open(editorUrl);
    }
  }
})();

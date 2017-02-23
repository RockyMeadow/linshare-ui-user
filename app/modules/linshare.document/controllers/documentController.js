(function() {
  'use strict';

  angular
    .module('linshare.document')
    .controller('documentController', documentController);

  function documentController($scope, $filter, LinshareDocumentRestService, NgTableParams, $translate, $window, $log,
                              $mdToast, documentsList, growlService, $timeout, documentUtilsService, $q,
                              flowUploadService, sharableDocumentService, lsAppConfig,
                              $stateParams, documentSelected) {
    var initFlagsOnSelectedPages = initFlagsOnSelectedPagesFunction;
    var swalCopyInGroup, swalShare, swalDelete, swalDownload, numItems, swalInformation;
    var swalMultipleDownloadTitle, swalMultipleDownloadText, swalMultipleDownloadConfirm;
    var swalNoDeleteElements, swalActionDelete, swalInfoErrorFile, swalClose;
    var swalCodeError404, swalCodeError403, swalCodeError400, swalCodeError500;

    $scope.addSelectedDocument = addSelectedDocument;
    $scope.addUploadedDocument = addUploadedDocument;
    $scope.backToSidebarContentDetails = backToSidebarContentDetails;
    $scope.closeDetailSidebar = closeDetailSidebar;
    $scope.closeSearch = closeSearch;
    $scope.closeToast = closeToast;
    $scope.currentDocument = {};
    $scope.currentPage = 'my_files';
    $scope.currentSelectedDocument = {
      current: ''
    };
    $scope.data = {
      selectedIndex: 0,
      bottom: false
    };
    $scope.deleteDocuments = deleteDocuments;
    $scope.documentsList = documentsList;
    $scope.documentsListCopy = documentsList;
    $scope.documentSelected = documentSelected;
    $scope.downloadFile = downloadFile;
    $scope.downloadSelectedFiles = downloadSelectedFiles;
    $scope.fab = {
      isOpen: false,
      count: 0,
      selectedDirection: 'left'
    };
    $scope.flagsOnSelectedPages = {};
    $scope.flowUploadService = flowUploadService;
    $scope.getDetails = getDetails;
    $scope.getDocumentInfo = getDocumentInfo;
    $scope.getDocumentThumbnail = getDocumentThumbnail;
    $scope.lengthOfSelectedDocuments = lengthOfSelectedDocuments;
    $scope.loadSidebarContent = loadSidebarContent;
    $scope.lsAppConfig = lsAppConfig;
    $scope.lsFormat = lsFormat;
    $scope.lsFullDateFormat = lsFullDateFormat;
    $scope.mySpacePage = lsAppConfig.mySpacePage;
    $scope.nextTab = nextTab;
    $scope.onShare = onShare;
    $scope.openSearch = openSearch;
    $scope.paramFilter = {
      name: ''
    };
    $scope.previousTab = previousTab;
    $scope.recipientShareDetails = {
      current: ''
    };
    $scope.reloadDocuments = reloadDocuments;
    $scope.resetSelectedDocuments = resetSelectedDocuments;
    $scope.selectDocumentsOnCurrentPage = selectDocumentsOnCurrentPage;
    $scope.selectedDocuments = [];
    $scope.showCurrentFile = showCurrentFile;
    $scope.showToastDeleteError = showToastDeleteError;
    $scope.sortDropdownSetActive = sortDropdownSetActive;
    $scope.setTextInput = setTextInput;
    $scope.slideTextarea = slideTextarea;
    $scope.slideUpTextarea = slideUpTextarea;
    $scope.toggleFilterBySelectedFiles = toggleFilterBySelectedFiles;
    $scope.toggleSearchState = toggleSearchState;
    $scope.toggleSelectedSort = true;
    $scope.unavailableMultiDownload = unavailableMultiDownload;
    $scope.updateDocument = updateDocument;

    activate();

    ////////////////

    function activate() {
      $translate(['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TITLE',
          'SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TEXT',
          'SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.CONFIRM_BUTTON',
          'GROWL_ALERT.ACTION.DELETE', 'TOAST_ALERT.ACTION.INFO_ERROR_FILE',
          'TOAST_ALERT.ACTION.CLOSE', 'TOAST_ALERT.WARNING.ELEMENTS_NOT_DELETED',
          'TOAST_ALERT.WARNING.ERROR_404', 'TOAST_ALERT.WARNING.ERROR_403',
          'TOAST_ALERT.WARNING.ERROR_400', 'TOAST_ALERT.WARNING.ERROR_500'
        ])
        .then(function(translations) {
          swalMultipleDownloadTitle = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TITLE'];
          swalMultipleDownloadText = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TEXT'];
          swalMultipleDownloadConfirm = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.CONFIRM_BUTTON'];
          swalActionDelete = translations['GROWL_ALERT.ACTION.DELETE'];
          swalInfoErrorFile = translations['TOAST_ALERT.ACTION.INFO_ERROR_FILE'];
          swalClose = translations['TOAST_ALERT.ACTION.CLOSE'];
          swalNoDeleteElements = translations['TOAST_ALERT.WARNING.ELEMENTS_NOT_DELETED'];
          swalCodeError404 = translations['TOAST_ALERT.WARNING.ERROR_404'];
          swalCodeError403 = translations['TOAST_ALERT.WARNING.ERROR_403'];
          swalCodeError400 = translations['TOAST_ALERT.WARNING.ERROR_400'];
          swalCodeError500 = translations['TOAST_ALERT.WARNING.ERROR_500'];
        });
      $translate(['ACTION.COPY_TO', 'ACTION.SHARE', 'ACTION.INFORMATION',
          'ACTION.DELETE', 'ACTION.DOWNLOAD', 'SELECTION.NUM_ITEM_SELECTED'
        ])
        .then(function(translations) {
          swalCopyInGroup = translations['ACTION.COPY_TO'];
          swalShare = translations['ACTION.SHARE'];
          swalDelete = translations['ACTION.DELETE'];
          swalDownload = translations['ACTION.DOWNLOAD'];
          swalInformation = translations['ACTION.INFORMATION'];
          numItems = translations['SELECTION.NUM_ITEM_SELECTED'];
          $scope.moreOptionsContexualMenu = [
            [function($itemScope) {
              return $itemScope.selectedDocuments.length + ' ' + numItems;
            }],
            [swalShare, function() {
              $scope.onShare();
            }],
            [swalDelete, function($itemScope) {
              $scope.deleteDocuments($itemScope.selectedDocuments);
            }],
            [swalInformation, function($itemScope) {
              $scope.showCurrentFile($itemScope.documentFile);
            }, function($itemScope) {
              return $itemScope.selectedDocuments.length === 1;
            }],
            [swalCopyInGroup, function() {}, function() {
              return false;
            }],
            [swalDownload, function($itemScope) {
              var landingUrl = $itemScope.linshareBaseUrl + '/documents/' + $itemScope.documentFile.uuid + '/download';
              $window.location.href = landingUrl;
            }, function($itemScope) {
              return $itemScope.selectedDocuments.length === 1;
            }]
          ];
        });

      $scope.$on('$stateChangeSuccess', function() {
        angular.element('.multi-select-mobile').appendTo('body');
      });

      $scope.$on('linshare-share-done', function() {
        $scope.reloadDocuments();
      });

      $scope.$on('$stateChangeSuccess', function() {
        angular.element('.multi-select-mobile').appendTo('body');
      });

      $scope.$watch(function() {
        return documentUtilsService.reloadDocumentsList;
      }, function(newValue) {
        if (newValue) {
          $scope.reloadDocuments();
        }
      }, true);

      $scope.$watch('fab.isOpen', function(isOpen) {
        if (isOpen) {
          angular.element('.md-toolbar-tools').addClass('setWhite');
          angular.element('.multi-select-mobile').addClass('setDisabled');
          $timeout(function() {
            angular.element('#overlayMobileFab').addClass('toggledMobileShowOverlay');
            angular.element('#content-container').addClass('setDisabled');
          }, 250);
        } else {
          angular.element('.md-toolbar-tools').removeClass('setWhite');
          $timeout(function() {
            angular.element('.multi-select-mobile').removeClass('setDisabled');
            angular.element('#overlayMobileFab').removeClass('toggledMobileShowOverlay');
            angular.element('#content-container').removeClass('setDisabled');
          }, 250);
        }
      });

      loadTable().then(function(data) {
        $scope.tableParams = data;
        if (_.isUndefined($scope.documentSelected)) {
          $translate('GROWL_ALERT.ERROR.FILE_NOT_FOUND').then(function(message) {
            growlService.notifyTopCenter(message, 'danger');
          });
        }
        else if ($scope.documentSelected !== null) {
          $mdToast.show({
            scope: $scope,
            preserverScope: true,
            hideDelay: 0,
            position: 'bottom',
            templateUrl: 'modules/linshare.document/views/toast-file-isolate.html'
          });
          $scope.addSelectedDocument($scope.documentSelected);
          $scope.coatchMarkEye = true;
          $scope.toggleFilterBySelectedFiles();
          $scope.showCurrentFile($scope.documentSelected);
        }
      });
    }

    function addSelectedDocument(document) {
      documentUtilsService.selectDocument($scope.selectedDocuments, document);
    }

    function addUploadedDocument(flowFile) {
      if(flowFile._from === $scope.mySpacePage) {
        flowFile.asyncUploadDeferred.promise.then(function(file) {
          $scope.documentsListCopy.push(file.linshareDocument);
          $scope.isNewAddition = true;
          $scope.tableParams.reload();
          $timeout(function() {
            $scope.isNewAddition = false;
          }, 0);
        });
      }
    }

    function backToSidebarContentDetails() {
      if ($scope.sidebarRightDataType === lsAppConfig.shareDetails) {
        $scope.loadSidebarContent(lsAppConfig.details);
      }
    }

    function closeDetailSidebar() {
      angular.element('#file-list-table tr li').removeClass('activeActionButton');
    }

    function closeSearch() {
      angular.element('#drop-area').removeClass('search-toggled');
      angular.element('#searchInMobileFiles').val('').trigger('change');
    }

    function closeToast() {
      $mdToast.hide().then(function() {});
    }

    function deleteCallback(items) {
      var responsesDeletion = [];
      $q.all(sortResponseDeletion(items, responsesDeletion)).then(function() {
        if (responsesDeletion.length > 0) {
          $scope.showToastDeleteError();
          $scope.responses = [];
          _.forEach(responsesDeletion, function(responseItems) {
            switch (responseItems[1].status) {
              case 404:
                $scope.responses.push({
                  'name': responseItems[0],
                  'messageError': swalCodeError404
                });
                break;
              case 403:
                $scope.responses.push({
                  'name': responseItems[0],
                  'messageError': swalCodeError403
                });
                break;
              case 400:
                $scope.responses.push({
                  'name': responseItems[0],
                  'messageError': swalCodeError400
                });
                break;
              default:
                $scope.responses.push({
                  'name': responseItems[0],
                  'messageError': swalCodeError500
                });
            }
          });
        } else {
          $timeout(function() {
            growlService.notifyTopRight('GROWL_ALERT.ACTION.DELETE', 'inverse');
            $scope.getUserQuotas();
          }, 350);
        }
      });
      closeToast();
    }

    function deleteDocuments(items) {
      documentUtilsService.deleteDocuments(items, deleteCallback);
    }

    /**
     *  @name downloadFile
     *  @desc Download a file of a document for the user
     *  @param {Object) documentFile - A document object
     *  @memberOf LinShare.document.documentController
     */
    function downloadFile(documentFile) {
      LinshareDocumentRestService.download(documentFile.uuid).then(function(fileStream) {
          documentUtilsService.downloadFileFromResponse(fileStream, documentFile.name, documentFile.type);
        });
    }

    function downloadSelectedFiles(selectedDocuments) {
      _.forEach(selectedDocuments, function(document) {
        $scope.downloadFile(document);
      });
    }

    function getDetails(item) {
      return documentUtilsService.getItemDetails(LinshareDocumentRestService, item);
    }

    function getDocumentInfo(uuid) {
      LinshareDocumentRestService.get(uuid).then(function(data) {
        $scope.currentSelectedDocument.current.shares = data.shares;
      });
    }

    function getDocumentThumbnail(uuid) {
      LinshareDocumentRestService.thumbnail(uuid).then(function(thumbnail) {
        $scope.currentSelectedDocument.current.thumbnail = thumbnail;
      });
    }

    function initFlagsOnSelectedPagesFunction() {
      $scope.flagsOnSelectedPages = {};
    }

    function lengthOfSelectedDocuments() {
      return $scope.selectedDocuments.length;
    }

    function loadSelectedDocument(filteredData) {
      var documentToSelect = _.find(filteredData, {
        'uuid': $stateParams.uploadedFileUuid
      });
      if (!_.isUndefined(documentToSelect)) {
        addSelectedDocument(documentToSelect);
      }
    }

    /**
     * @name loadSidebarContent
     * @desc Update the content of the sidebar
     * @param {String} content The id of the content to load,
     *                 see app/views/includes/sidebar-right.html for possible values
     * @memberOf LinShare.document.documentController
     */
    function loadSidebarContent(content) {
      $scope.mainVm.sidebar.setData($scope);
      $scope.mainVm.sidebar.setContent(content || lsAppConfig.share);
      $scope.mainVm.sidebar.show();
    }

    function loadSpecificPage() {
      var items = _.orderBy($scope.documentsList.plain(), 'modificationDate', ['desc']);
      if ($stateParams.uploadedFileUuid) {
        return Math.floor(_.findIndex(items, {
          'uuid': $stateParams.uploadedFileUuid
        }) / 10) + 1;
      }
      return 1;
    }

    function loadTable() {
      return $q(function(resolve) {
        resolve(
          new NgTableParams({
            page: loadSpecificPage(),
            sorting: {
              modificationDate: 'desc'
            },
            count: 10,
            filter: $scope.paramFilter
          }, {
            total: $scope.documentsList.length,
            getData: function($defer, params) {
              var filteredData =
                params.filter() ? $filter('filter')($scope.documentsList, params.filter()) : $scope.documentsList;
              var files = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
              params.total(files.length);
              if ($stateParams.uploadedFileUuid) {
                loadSelectedDocument(filteredData);
              }
              $defer.resolve(files.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          })
        );
      });
    }

    function lsFormat() {
      return $translate.use() === 'fr-FR' ? 'd MMMM y' : 'MMMM d y';
    }

    function lsFullDateFormat() {
      return $translate.use() === 'fr-FR' ? 'Le d MMMM y à  h:mm a' : 'The MMMM d  y at h:mma';
    }

    function nextTab() {
      $scope.data.selectedIndex = Math.min($scope.data.selectedIndex + 1, 2);
    }

    function onShare(document) {
      $scope.loadSidebarContent();
      $timeout(function() {
        angular.element('#focusInputShare').trigger('focus');
      }, 350);
      if (document) {
        var index = $scope.selectedDocuments.indexOf(document);
        if (index === -1) {
          document.isSelected = true;
          $scope.selectedDocuments.push(document);
        } else {
          $log.debug('addItem - item is already in the list');
        }
      }
    }

    function openSearch() {
      angular.element('#drop-area').addClass('search-toggled');
      angular.element('#top-search-wrap input').focus();
    }

    function previousTab() {
      $scope.data.selectedIndex = Math.max($scope.data.selectedIndex - 1, 0);
    }

    function reloadDocuments() {
      $timeout(function() {
        LinshareDocumentRestService.getList().then(function(data) {
          $scope.documentsList = data;
          $scope.documentsListCopy = data;
          $scope.isNewAddition = true;
          $scope.tableParams.reload();
          $timeout(function() {
            $scope.isNewAddition = false;
          }, 0);
        }, 500);
      });
    }

    function resetSelectedDocuments() {
      $scope.activeBtnShowSelection = !$scope.activeBtnShowSelection;
      $scope.coatchMarkEye = false;
      delete $scope.tableParams.filter().isSelected;
      _.forEach($scope.selectedDocuments, function(selectedDoc) {
        selectedDoc.isSelected = false;
      });
      initFlagsOnSelectedPages();
      $scope.selectedDocuments = [];
    }

    function selectDocumentsOnCurrentPage(data, page, selectFlag) {
      var currentPage = page || $scope.tableParams.page();
      var dataOnPage = data || $scope.tableParams.data;
      var select = selectFlag || $scope.flagsOnSelectedPages[currentPage];
      if (!select) {
        _.forEach(dataOnPage, function(element) {
          if (!element.isSelected) {
            element.isSelected = true;
            $scope.selectedDocuments.push(element);
          }
        });
        $scope.flagsOnSelectedPages[currentPage] = true;
      } else {
        $scope.selectedDocuments = _.xor($scope.selectedDocuments, dataOnPage);
        _.forEach(dataOnPage, function(element) {
          if (element.isSelected) {
            element.isSelected = false;
            _.remove($scope.selectedDocuments, function(n) {
              return n.uuid === element.uuid;
            });
          }
        });
        $scope.flagsOnSelectedPages[currentPage] = false;
      }
    }

    function setTextInput($event) {
      var currTarget = $event.currentTarget;
      var inputTxt = angular.element(currTarget).text();
      if (inputTxt === '') {
        angular.element(currTarget).parent().find('span').css('display', 'block');
      } else {
        angular.element(currTarget).parent().find('span').css('display', 'none');
      }
    }

    /**
     * @name showCurrentFile
     * @desc Get information from a file and show the sidebar details at a given tab
     * @param {Object} currentFile - A Document file object
     * @param {event} event - Event occuring launching the action
     * @param {number} tabIndex - Index of the sidebar details tab to show
     * @memberOf LinShare.document.documentController
     */
    function showCurrentFile(currentFile, event, tabIndex) {
      $scope.currentSelectedDocument.current = currentFile;
      LinshareDocumentRestService.get(currentFile.uuid).then(function(data) {
        $scope.currentSelectedDocument.current = data;
      });
      if (currentFile.hasThumbnail) {
        LinshareDocumentRestService.thumbnail(currentFile.uuid).then(function(thumbnail) {
          $scope.currentSelectedDocument.current.thumbnail = thumbnail;
        });
      }
      $scope.loadSidebarContent(lsAppConfig.details);
      $scope.data.selectedIndex = tabIndex ? tabIndex : 0;
      if (!_.isUndefined(event)) {
        var currElm = event.currentTarget;
        angular.element('#file-list-table tr li').removeClass('activeActionButton').promise().done(function() {
          angular.element(currElm).addClass('activeActionButton');
        });
      }
    }

    function showToastDeleteError() {
      $mdToast.show({
        scope: $scope,
        preserveScope: true,
        hideDelay: 0,
        position: 'top right',
        templateUrl: 'modules/linshare.document/views/toast-delete-file-error.html'
      });
    }

    function slideTextarea($event) {
      var currTarget = $event.currentTarget;
      angular.element(currTarget).parent().addClass('show-full-comment');
    }

    function slideUpTextarea($event) {
      var currTarget = $event.currentTarget;
      angular.element(currTarget).parent().removeClass('show-full-comment');
    }

    function sortDropdownSetActive(sortField, $event) {
      $scope.toggleSelectedSort = !$scope.toggleSelectedSort;
      $scope.tableParams.sorting(sortField, $scope.toggleSelectedSort ? 'desc' : 'asc');
      var currTarget = $event.currentTarget;
      angular.element('.labeled-dropdown.open a').removeClass('selected-sorting').promise().done(function() {
        angular.element(currTarget).addClass('selected-sorting');
      });
    }

    function sortResponseDeletion(items, responsesDeletion) {
      if (items) {
        return _.map(items, function(restangularizedItem) {
          return restangularizedItem.remove().then(function() {
            _.remove($scope.documentsList, restangularizedItem);
            _.remove($scope.selectedDocuments, restangularizedItem);
            $scope.documentsListCopy = $scope.documentsList; // I keep a copy of the data for the filter module
            $scope.tableParams.reload();
            initFlagsOnSelectedPages();
            return responsesDeletion;
          }).catch(function(error) {
            responsesDeletion.push([restangularizedItem.name, error]);
            return responsesDeletion;
          });
        });
      }
    }

    function toggleFilterBySelectedFiles() {
      $scope.activeBtnShowSelection = !$scope.activeBtnShowSelection;
      if ($scope.tableParams.filter().isSelected) {
        delete $scope.tableParams.filter().isSelected;
      } else {
        $scope.tableParams.filter().isSelected = true;
      }
    }

    function toggleSearchState() {
      if (!$scope.searchMobileDropdown) {
        $scope.openSearch();
      } else {
        $scope.closeSearch();
      }
      $scope.searchMobileDropdown = !$scope.searchMobileDropdown;
    }

    /**
     * Update a document
     * @param document
     */
    function updateDocument(document) {
      var documentServer = _.cloneDeep(document);
      $translate(['SAVING'])
        .then(function(translations) {
          /* jshint sub: true */
          var swalSaving = translations['SAVING'];
          $scope.currentSelectedDocument.current.description = swalSaving;
          LinshareDocumentRestService.update(documentServer.uuid, documentServer).then(function() {
            $scope.currentSelectedDocument.current.description = documentServer.description;
          });
        });
    }

    function unavailableMultiDownload() {
      swal({
        title: swalMultipleDownloadTitle,
        text: swalMultipleDownloadText,
        type: 'error',
        confirmButtonColor: '#05b1ff',
        confirmButtonText: swalMultipleDownloadConfirm,
        closeOnConfirm: true
      });
    }
  }
})();

angular
  .module('linshare.uploadRequests')
  .controller('uploadRequestEntriesController', uploadRequestEntriesController);

uploadRequestEntriesController.$inject = [
  '_',
  '$q',
  '$log',
  '$state',
  '$transition$',
  'documentUtilsService',
  'lsAppConfig',
  'LinshareDocumentRestService',
  'sidebarService',
  'tableParamsService',
  'toastService',
  'uploadRequest',
  'uploadRequestEntryRestService',
  'uploadRequestGroup',
  'UploadRequestGroupObjectService',
  'uploadRequestGroupRestService',
  'UploadRequestObjectService',
  'uploadRequestRestService',
  'uploadRequestUtilsService',
  'UPLOAD_REQUESTS_STATE_STATUS_MAPPING'
];

function uploadRequestEntriesController(
  _,
  $q,
  $log,
  $state,
  $transition$,
  documentUtilsService,
  lsAppConfig,
  LinshareDocumentRestService,
  sidebarService,
  tableParamsService,
  toastService,
  uploadRequest,
  uploadRequestEntryRestService,
  uploadRequestGroup,
  UploadRequestGroupObjectService,
  uploadRequestGroupRestService,
  UploadRequestObjectService,
  uploadRequestRestService,
  uploadRequestUtilsService,
  UPLOAD_REQUESTS_STATE_STATUS_MAPPING
) {
  const uploadRequestEntriesVm = this;
  const { openWarningDialogFor, showToastAlertFor } = uploadRequestUtilsService;
  const entryToSelect = $transition$.params().entryUuid;

  uploadRequestEntriesVm.$onInit = onInit;
  uploadRequestEntriesVm.goBack = goBack;
  uploadRequestEntriesVm.uploadRequest = uploadRequest;
  uploadRequestEntriesVm.uploadRequestGroup = uploadRequestGroup;
  uploadRequestEntriesVm.isArchived = uploadRequest.status === 'ARCHIVED';
  uploadRequestEntriesVm.backgroundContent = getBackgroundContent();
  uploadRequestEntriesVm.openAddingRecipientsSideBar = openAddingRecipientsSideBar;
  uploadRequestEntriesVm.showUploadRequestDetails = showUploadRequestDetails;
  uploadRequestEntriesVm.paramFilter = { name: '' };
  uploadRequestEntriesVm.fabButton = {
    toolbar: {
      activate: true,
      label: 'UPLOAD_REQUESTS.TITLE_SINGULAR'
    },
    actions: [
      {
        label: 'UPLOAD_REQUESTS.TABLE.OPTIONS.ADD_RECIPIENTS',
        icon: 'ls-add-user-sm',
      }
    ]
  };

  function onInit() {
    return uploadRequestRestService.listEntries(uploadRequest.uuid)
      .then(entries => {
        uploadRequestEntriesVm.itemsList = entries;

        tableParamsService.initTableParams(uploadRequestEntriesVm.itemsList, uploadRequestEntriesVm.paramFilter, entryToSelect)
          .then(data => {
            uploadRequestEntriesVm.currentSelectedEntry = {};
            uploadRequestEntriesVm.tableParamsService = tableParamsService;
            uploadRequestEntriesVm.resetSelectedEntries = tableParamsService.resetSelectedItems;
            uploadRequestEntriesVm.selectEntriesOnCurrentPage = tableParamsService.tableSelectAll;
            uploadRequestEntriesVm.toggleEntrySelection = tableParamsService.toggleItemSelection;
            uploadRequestEntriesVm.sortDropdownSetActive = tableParamsService.tableSort;
            uploadRequestEntriesVm.toggleFilterBySelectedFiles = tableParamsService.isolateSelection;
            uploadRequestEntriesVm.toggleSearchState = toggleSearchState;
            uploadRequestEntriesVm.selectedEntries = tableParamsService.getSelectedItemsList();
            uploadRequestEntriesVm.tableParams = tableParamsService.getTableParams();
            uploadRequestEntriesVm.flagsOnSelectedPages = tableParamsService.getFlagsOnSelectedPages();
            uploadRequestEntriesVm.toggleSelectedSort = tableParamsService.getToggleSelectedSort();
            uploadRequestEntriesVm.downloadEntry = downloadEntry;
            uploadRequestEntriesVm.deleteEntries = deleteEntries;
            uploadRequestEntriesVm.copyEntriesToMySpace = copyEntriesToMySpace;
            uploadRequestEntriesVm.shareEntry = shareEntry;
            uploadRequestEntriesVm.showEntryDetails = showEntryDetails;

            if (entryToSelect && !data.itemToSelect) {
              toastService.error({key: 'TOAST_ALERT.ERROR.FILE_NOT_FOUND'});
            }
          });
      });
  }

  function goBack(options = { toUploadRequestGroup: false }) {
    if (uploadRequest.collective) {
      options.toUploadRequestGroup = true;
    }

    if (options.toUploadRequestGroup) {
      const status = _.findKey(
        UPLOAD_REQUESTS_STATE_STATUS_MAPPING,
        state => state.includes(uploadRequest.status)
      );

      return $state.go(`uploadRequestGroups.${status}`, { reload: true });
    }

    $state.go('uploadRequests', {
      uploadRequestGroupUuid: uploadRequestGroup.uuid
    }, { reload: true });
  }

  function toggleSearchState() {
    if (!uploadRequestEntriesVm.searchMobileDropdown) {
      angular.element('#drop-area').addClass('search-toggled');
      angular.element('#top-search-wrap input').trigger('focus');
    } else {
      angular.element('#drop-area').removeClass('search-toggled');
      angular.element('#searchInMobileFiles').val('').trigger('change');
    }
    uploadRequestEntriesVm.searchMobileDropdown = !uploadRequestEntriesVm.searchMobileDropdown;
  }

  function getBackgroundContent() {
    const content = {
      title: 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST.TITLE',
      message: 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST.MESSAGE'
    };

    if (uploadRequest.status === 'CREATED') {
      content.title = 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST_PENDING.TITLE';
      content.message = 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST_PENDING.MESSAGE';
    }

    if (uploadRequest.status === 'ARCHIVED') {
      content.title = 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST_ARCHIVED.TITLE';
      content.message = 'UPLOAD_REQUESTS.TABLE.BACKGROUND_CONTENT.ENTRY_LIST_ARCHIVED.MESSAGE';
    }

    return content;
  }

  function downloadEntry(entry) {
    const url = uploadRequestEntryRestService.getDownloadUrl(entry.uuid);

    documentUtilsService.download(url, entry.name);
  }

  function deleteEntries(entries) {
    openWarningDialogFor('delete_entries', entries)
      .then(() => $q.allSettled(
        entries.map(entry => uploadRequestEntryRestService.remove(entry.uuid))
      ))
      .then(promises => {
        const deletedEntries = promises
          .filter(promise => promise.state === 'fulfilled')
          .map(promise => promise.value);
        const notDeletedEntries = promises
          .filter(promise => promise.state === 'rejected')
          .map(promise => promise.reason);

        _.remove(uploadRequestEntriesVm.itemsList, item => deletedEntries.some(request => request.uuid === item.uuid));
        _.remove(uploadRequestEntriesVm.selectedEntries, selected => deletedEntries.some(request => request.uuid === selected.uuid));

        uploadRequestEntriesVm.tableParams.reload();
        uploadRequestEntriesVm.resetSelectedEntries();

        if (notDeletedEntries.length) {
          showToastAlertFor('delete_entries', 'error', notDeletedEntries);
        } else {
          showToastAlertFor('delete_entries', 'info', deletedEntries);
        }
      })
      .catch(error => {
        if (error) { $log.error(error); }
      });
  }

  function copyEntriesToMySpace(entries) {
    $q.allSettled(entries.map(entry => LinshareDocumentRestService.copy(entry.uuid, 'UPLOAD_REQUEST')))
      .then(promises => {
        const copied = promises
          .filter(promise => promise.state === 'fulfilled')
          .map(promise => promise.value);
        const rejectedPromises = promises
          .filter(promise => promise.state === 'rejected')
          .map(promise => promise.reason);

        entries
          .map(entry => entry.uuid)
          .forEach(entryUuid => {
            const selectedEntry = uploadRequestEntriesVm.selectedEntries.find(entry => entry.uuid === entryUuid);

            if (selectedEntry) {
              uploadRequestEntriesVm.toggleEntrySelection(selectedEntry);
            }
          });

        uploadRequestEntriesVm.resetSelectedEntries();

        if (rejectedPromises.length) {
          showToastAlertFor('copy_entries', 'error', rejectedPromises);
        } else {
          showToastAlertFor('copy_entries', 'info', copied).then(response => {
            if (response.actionClicked) {
              const copiedFileUuid = copied.length === 1 ? copied[0][0].uuid : null;

              $state.go('documents.files', { uploadedFileUuid: copiedFileUuid });
            }
          });
        }
      });
  }

  function shareEntry(entry) {
    LinshareDocumentRestService.copy(entry.uuid, 'UPLOAD_REQUEST')
      .then(copied => {
        $state.go('documents.files', {
          shareFileUuid: copied[0].uuid
        });
      })
      .catch(error => {
        if (error) {
          showToastAlertFor('copy_entries', 'error', [entry]);
        }
      });
  }

  function showEntryDetails(entry) {
    uploadRequestEntriesVm.currentSelectedEntry = entry;

    sidebarService.setContent(lsAppConfig.uploadRequestEntryDetails);
    sidebarService.setData(uploadRequestEntriesVm);
    sidebarService.show();
  }

  function openAddingRecipientsSideBar(uploadRequest = {}) {
    uploadRequest.recipients = [];

    uploadRequestGroupRestService.listUploadRequests(uploadRequest.uuid)
      .then(uploadRequests => uploadRequests.forEach(item => uploadRequest.recipients.push(...item.recipients)))
      .then(() => {
        const uploadRequestObject = new UploadRequestGroupObjectService(uploadRequest, {
          submitRecipientsCallback: () => {
            sidebarService.hide();
          }
        });

        uploadRequestEntriesVm.currentSelectedUploadRequest = uploadRequest;
        uploadRequestUtilsService.openAddingRecipientsSideBar(uploadRequestObject);
      });
  }

  function showUploadRequestDetails() {
    const content = uploadRequest.collective ?
      lsAppConfig.uploadRequestGroupDetails :
      lsAppConfig.uploadRequestDetails;

    if (
      sidebarService.isVisible() &&
      sidebarService.getContent() === content
    ) { return ;}

    const data = {
      onUpdateSuccess() {
        sidebarService.hide();
        $state.reload();
      }
    };
    const fetchers = uploadRequest.collective ?
      [
        uploadRequestGroupRestService.get(uploadRequestGroup.uuid),
        uploadRequestGroupRestService.listUploadRequests(uploadRequestGroup.uuid)
      ] :
      [
        uploadRequestRestService.get(uploadRequest.uuid)
      ];

    $q.all(fetchers).then(results => {
      if (uploadRequest.collective) {
        data.uploadRequestGroupObject = new UploadRequestGroupObjectService({
          ...results[0],
          recipients: results[1][0].recipients.map(recipient => recipient.mail)
        });
      } else {
        data.uploadRequestObject = new UploadRequestObjectService(results[0]);
      }

      sidebarService.setData(data);
      sidebarService.setContent(content);
      sidebarService.show();
    });
  }
}

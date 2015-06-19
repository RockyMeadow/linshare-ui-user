/**
 * Created by Alpha O. Sall on 3/3/15.
 */
'use strict';
/**
 * @ngdoc function
 * @name linshareUiUserApp.controller:FilesController
 * @description
 * # FilesController
 * Controller of the linshareUiUserApp
 */
angular.module('linshareUiUserApp')
  .controller('FilesController', function($scope,  $filter, filesService, ngTableParams, $window, $log){
    //$scope.user = user;
    $scope.download = function(){
      angular.forEach($scope.SelectedElement, function(uuid){
        filesService.downloadFiles(uuid).then(function(file) {
          console.log(file);
          var blob = new Blob([file], {type: 'text/plain'});
          $scope.url = window.URL.createObjectURL(blob);
          console.log('url', $scope.url);
         // $window.open(url);
        //return file;
      });

      });
    };
    $scope.SelectedElement = [];
    $scope.allFiles = filesService.getAllFiles();
    $scope.delete = function() {
      angular.forEach($scope.SelectedElement, function(uuid){
        $log.debug('value to delete', uuid);
        filesService.delete(uuid).then(function(){
          $scope.tableParams.reload();

          $scope.SelectedElement = [];
        });
      });
    };
    $scope.documentDetails = {};
    $scope.close = function() {
      document.getElementsByTagName('section')[3].style.className = 'col-md-12';
      document.getElementsByTagName('section')[4].style.display = 'none';

    };
    $scope.tableParams = new ngTableParams({
      page: 1,
      sorting: {creationDate: 'desc'},
      count: 20
    }, {
      getData: function($defer, params) {
        $scope.allFiles.then(function(files) {
          files = params.sorting() ? $filter('orderBy')(files, params.orderBy()) : files;
          params.total(files.length);
          $defer.resolve(files.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        });
      }

    });

  });

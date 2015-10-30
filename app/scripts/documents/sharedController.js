'use strict';

angular.module('linshareUiUserApp')
  .controller('SharedController', function($scope,  $filter, ngTableParams, LinshareShareService, LinshareDocumentService){

        //$scope.user = user;

        $scope.download = function(uuid){
          LinshareDocumentService.downloadFiles(uuid).then(function(file){
            console.log(file);
            $scope.url = window.URL.createObjectURL(file);
            console.log('url', 'url');
            //$window.open(url);
            //return file;

          });
        };
        $scope.tableParams = new ngTableParams({
          page: 1,
          count: 10
        }, {
          getData: function($defer, params){
            LinshareShareService.getMyShares().then(function(files){
              files = params.sorting() ? $filter('orderBy')(files, params.orderBy()) : files;
              params.total(files.length);
              $defer.resolve(files.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            });
          }

        });


  });
///<reference path="typings/angularjs/angular.d.ts"/>
location.hash = ''; // avoid reload errors

declare var MainController;
var app = angular.module('ExpressMockerAdmin',['ngRoute','ui.ace','ngSanitize']);
app.controller('MainController', MainController  )
	.config(['$routeProvider', function($routeProvider)
	{
		$routeProvider.
			when('/list/:page',{action:'list'}).
			when('/edit/:id',{action:'edit'}).
			when('/add',{action:'add'}).
			otherwise({
				redirectTo: '/list/0'
			});
	}])
	.directive('ngFileSelect', [ '$parse', '$http', '$timeout', function($parse, $http, $timeout)
	{
		return function(scope, elem, attr) {
			var fn = $parse(attr['ngFileSelect']);
			elem.bind('change', function(evt) {

				var files = [], fileList, i;
				fileList = evt.target.files;
				if (fileList != null) {
					for (i = 0; i < fileList.length; i++) {
						files.push(fileList.item(i));
					}
				}

				fn(scope, {
					$files : files,
					$event : evt
				});

			});
			elem.bind('click', function(){
				this.value = null;
			});
		};
	}])
	// filter to paginate table results
	.filter('startFrom', function() {
		return function(input, start) {
			start = +start; //parse to int
			return input.slice(start);
		}
	});
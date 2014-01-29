var app = angular.module('ExpressMockerAdmin',['ngRoute','ui.ace','ngSanitize']);
app.controller('MainController', MainController )
	.config(['$routeProvider', function($routeProvider)
	{
		$routeProvider.
			when('/list',{action:'list'}).
			when('/edit/:id',{action:'edit'}).
			when('/add',{action:'add'}).
			otherwise({
				redirectTo: '/list'
			});
	}]);
app.directive('ngFileSelect', [ '$parse', '$http', '$timeout', function($parse, $http, $timeout) {

	return function(scope, elem, attr) {
		console.log('aaaa')
		var fn = $parse(attr['ngFileSelect']);
		console.log( attr['ngFileSelect'], fn )
		elem.bind('change', function(evt) {
			console.log('pepepepepe')
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
} ]);
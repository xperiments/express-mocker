///<reference path="typings/angularjs/angular.d.ts"/>
///<reference path="typings/angularjs/angular-route.d.ts"/>
var MainController = (function () {
    function MainController($scope, $http, $route, $routeParams, $location, $timeout, $sce, $filter) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.$timeout = $timeout;
        this.$sce = $sce;
        this.$filter = $filter;
        this.markDownTemplate = '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1.0, user-scalable=yes"><style>body{font-family:Helvetica,arial,sans-serif;font-size:14px;line-height:1.6;padding-top:10px;padding-bottom:10px;background-color:white;padding:30px}body>*:first-child{margin-top:0!important}body>*:last-child{margin-bottom:0!important}a{color:#4183c4}a.absent{color:#c00}a.anchor{display:block;padding-left:30px;margin-left:-30px;cursor:pointer;position:absolute;top:0;left:0;bottom:0}h1,h2,h3,h4,h5,h6{margin:20px 0 10px;padding:0;font-weight:bold;-webkit-font-smoothing:antialiased;cursor:text;position:relative}h1:hover a.anchor,h2:hover a.anchor,h3:hover a.anchor,h4:hover a.anchor,h5:hover a.anchor,h6:hover a.anchor{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA09pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoMTMuMCAyMDEyMDMwNS5tLjQxNSAyMDEyLzAzLzA1OjIxOjAwOjAwKSAgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUM2NjlDQjI4ODBGMTFFMTg1ODlEODNERDJBRjUwQTQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUM2NjlDQjM4ODBGMTFFMTg1ODlEODNERDJBRjUwQTQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5QzY2OUNCMDg4MEYxMUUxODU4OUQ4M0REMkFGNTBBNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5QzY2OUNCMTg4MEYxMUUxODU4OUQ4M0REMkFGNTBBNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsQhXeAAAABfSURBVHjaYvz//z8DJYCRUgMYQAbAMBQIAvEqkBQWXI6sHqwHiwG70TTBxGaiWwjCTGgOUgJiF1J8wMRAIUA34B4Q76HUBelAfJYSA0CuMIEaRP8wGIkGMA54bgQIMACAmkXJi0hKJQAAAABJRU5ErkJggg==) no-repeat 10px center;text-decoration:none}h1 tt,h1 code{font-size:inherit}h2 tt,h2 code{font-size:inherit}h3 tt,h3 code{font-size:inherit}h4 tt,h4 code{font-size:inherit}h5 tt,h5 code{font-size:inherit}h6 tt,h6 code{font-size:inherit}h1{font-size:28px;color:black}h2{font-size:24px;border-bottom:1px solid #ccc;color:black}h3{font-size:18px}h4{font-size:16px}h5{font-size:14px}h6{color:#777;font-size:14px}p,blockquote,ul,ol,dl,li,table,pre{margin:15px 0}hr{background:transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAECAYAAACtBE5DAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OENDRjNBN0E2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OENDRjNBN0I2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4Q0NGM0E3ODY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4Q0NGM0E3OTY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqqezsUAAAAfSURBVHjaYmRABcYwBiM2QSA4y4hNEKYDQxAEAAIMAHNGAzhkPOlYAAAAAElFTkSuQmCC) repeat-x 0 0;border:0 none;color:#ccc;height:4px;padding:0}body>h2:first-child{margin-top:0;padding-top:0}body>h1:first-child{margin-top:0;padding-top:0}body>h1:first-child+h2{margin-top:0;padding-top:0}body>h3:first-child,body>h4:first-child,body>h5:first-child,body>h6:first-child{margin-top:0;padding-top:0}a:first-child h1,a:first-child h2,a:first-child h3,a:first-child h4,a:first-child h5,a:first-child h6{margin-top:0;padding-top:0}h1 p,h2 p,h3 p,h4 p,h5 p,h6 p{margin-top:0}li p.first{display:inline-block}li{margin:0}ul,ol{padding-left:30px}ul :first-child,ol :first-child{margin-top:0}dl{padding:0}dl dt{font-size:14px;font-weight:bold;font-style:italic;padding:0;margin:15px 0 5px}dl dt:first-child{padding:0}dl dt>:first-child{margin-top:0}dl dt>:last-child{margin-bottom:0}dl dd{margin:0 0 15px;padding:0 15px}dl dd>:first-child{margin-top:0}dl dd>:last-child{margin-bottom:0}blockquote{border-left:4px solid #ddd;padding:0 15px;color:#777}blockquote>:first-child{margin-top:0}blockquote>:last-child{margin-bottom:0}table{padding:0;border-collapse:collapse}table tr{border-top:1px solid #ccc;background-color:white;margin:0;padding:0}table tr:nth-child(2n){background-color:#f8f8f8}table tr th{font-weight:bold;border:1px solid #ccc;margin:0;padding:6px 13px}table tr td{border:1px solid #ccc;margin:0;padding:6px 13px}table tr th :first-child,table tr td :first-child{margin-top:0}table tr th :last-child,table tr td :last-child{margin-bottom:0}img{max-width:100%}span.frame{display:block;overflow:hidden}span.frame>span{border:1px solid #ddd;display:block;float:left;overflow:hidden;margin:13px 0 0;padding:7px;width:auto}span.frame span img{display:block;float:left}span.frame span span{clear:both;color:#333;display:block;padding:5px 0 0}span.align-center{display:block;overflow:hidden;clear:both}span.align-center>span{display:block;overflow:hidden;margin:13px auto 0;text-align:center}span.align-center span img{margin:0 auto;text-align:center}span.align-right{display:block;overflow:hidden;clear:both}span.align-right>span{display:block;overflow:hidden;margin:13px 0 0;text-align:right}span.align-right span img{margin:0;text-align:right}span.float-left{display:block;margin-right:13px;overflow:hidden;float:left}span.float-left span{margin:13px 0 0}span.float-right{display:block;margin-left:13px;overflow:hidden;float:right}span.float-right>span{display:block;overflow:hidden;margin:13px auto 0;text-align:right}code,tt{margin:0 2px;padding:0 5px;white-space:nowrap;border:1px solid #eaeaea;background-color:#f8f8f8;border-radius:3px}pre code{margin:0;padding:0;white-space:pre;border:0;background:transparent}.highlight pre{background-color:#f8f8f8;border:1px solid #ccc;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px;border-radius:3px}pre{background-color:#f8f8f8;border:1px solid #ccc;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px;border-radius:3px}pre code,pre tt{background-color:transparent;border:0}sup{font-size:.83em;vertical-align:super;line-height:0}*{-webkit-print-color-adjust:exact}@media screen and (min-width:914px){body{width:854px;margin:0 auto}}@media print{table,pre{page-break-inside:avoid}pre{word-wrap:break-word}}</style><title>ExpressMocker</title></head><body>{{code}}</body></html>';
        this.showdown = new Showdown.converter();
        // UI SWITCHS
        this.listVisible = true;
        this.previewRouteVisible = false;
        this.previewDescription = false;
        this.showDescription = false;
        // BASE
        this.loading = true;
        this.reloadNeeded = false;
        this.docsFile = "docs.html";
        // LIST
        this.currentListPage = 0;
        this.currentListPageSize = 6;
        this.filteredRoutes = [];
        // EDITOR
        this.currentRoutePreviewCode = "";
        this.currentRoutePreviewMode = 0;
        this.currentRoute = { verb: 'get', active: true, route: '', response: { source: '' }, id: 'new', description: '' };
        this.currentRoutePreview = "";
        var timer;
        var timerDescription;
        var timerJSON;
        var timerSearch;

        // watch current route to detect route param changes
        $scope.$watch('mc.currentRoute.route', function () {
            if (timer) {
                $timeout.cancel(timer);
            }
            _this.currentRoute && _this.currentRoute.route != '' && (timer = $timeout(function () {
                _this.updateParams();
            }, 1000));
        });

        // watch current description to detect changes in the description editor
        /*$scope.$watch('mc.currentRoute.description', ()=>{
        if(timerDescription){
        $timeout.cancel(timerDescription)
        }
        if( this.previewDescription)
        {
        timerDescription= $timeout(()=>{ this.updateDescription() },500);
        }
        });*/
        $scope.$watch('mc.searchFilter', function () {
            if (timerSearch) {
                $timeout.cancel(timerSearch);
            }

            timerSearch = $timeout(function () {
                _this.updateSearchFilter();
            }, 300);
        });

        // watch admin side route changes
        // this is the actual app router
        this.$scope.$on("$routeChangeSuccess", function ($currentRoute, $previousRoute) {
            var action = _this.$route.current['action'];

            switch (action) {
                case "list":
                    _this.listVisible = true;
                    _this.currentListPage = parseInt(_this.$routeParams['page'], 10);
                    break;
                case "edit":
                    var id = _this.$routeParams['id'];
                    _this.edit(id);
                    break;
                case "add":
                    _this.add();
                    break;
            }
        });

        // list sorting
        $scope.sort = {
            column: '',
            descending: false
        };

        // TODO check what is causing the problem
        // inititalize to avoid init errors
        this.config = { port: 7878, quiet: false, defaultRoutes: [] };
        this.loadConfig();
    }
    // BASE
    MainController.prototype.loadConfig = function () {
        var _this = this;
        this.loading = true;
        this.$http.get('/express-mocker/config.json').success(function (data, status, headers, config) {
            _this.config = data;
            _this.loading = false;

            // Fix old routes
            _this.config.defaultRoutes.map(function (route) {
                if (!route.id) {
                    route.id = _this.shash(route.route);
                }
            });
            _this.showList();
        });
    };

    MainController.prototype.showList = function () {
        this.$location.path('/list');
        this.listVisible = true;
    };

    // LIST
    MainController.prototype.updateSearchFilter = function () {
        this.filteredRoutes = this.$filter('filter')(this.config.defaultRoutes, this.searchFilter);
    };

    // returns the total number of pagination pages
    MainController.prototype.numberOfPages = function () {
        return Math.ceil(this.filteredRoutes.length / this.currentListPageSize);
    };

    // angular helper that creates an array to iterate in the pages div
    MainController.prototype.numberOfPagesIterable = function () {
        var count = 0, total = this.numberOfPages();
        console.log(this.currentListPage, total);
        if (this.currentListPage > total)
            this.currentListPage = 0;
        return new Array(total + 1).join('0').split('').map(function (e) {
            return count++;
        });
    };

    // helper to change the route columns ordering
    MainController.prototype.changeListSorting = function (column) {
        var sort = this.$scope.sort;

        if (sort.column == column) {
            sort.descending = !sort.descending;
        } else {
            sort.column = column;
            sort.descending = false;
        }
    };

    MainController.prototype.toggleRouteActive = function (id) {
        var index = this.getRouteIndex(id);
        this.config.defaultRoutes[index].active = !this.config.defaultRoutes[index].active;
        this.saveToDisk();
    };

    MainController.prototype.add = function () {
        this.showDescription = false;
        this.previewDescription = false;
        this.editMode = MainController.MODE_ADD;
        this.currentResponseType = 0;
        this.currentRoute = { verb: 'get', active: true, route: '', response: { source: '' }, id: 'new' };
        this.listVisible = false;
        this.setType(0);
    };

    MainController.prototype.gotoEdit = function (id) {
        this.$location.path('/edit/' + id);
    };

    MainController.prototype.edit = function (id) {
        this.showDescription = false;
        this.previewDescription = false;
        this.editMode = MainController.MODE_EDIT;
        this.currentRoute = this.createEditObject(this.getRouteById(id));
        this.currentRouteId = id;
        this.listVisible = false;
    };

    MainController.prototype.delete = function (id) {
        var itemToDelete = this.config.defaultRoutes[this.getRouteIndex(id)];
        var itemPos = this.config.defaultRoutes.indexOf(itemToDelete);
        this.config.defaultRoutes.splice(itemPos, 1);
        this.saveToDisk();
        this.showList();
    };

    // EDITOR
    ///
    MainController.prototype.onDescriptionEditor = function (editor) {
        console.log(editor);
        //editor.setReadOnly(true);
    };

    MainController.prototype.toggleDescriptionPreview = function () {
        this.previewDescription = !this.previewDescription;
        if (this.previewDescription && !this.showDescription) {
            this.showDescription = true;
        }
        this.updateDescription();
    };
    MainController.prototype.toggleDescriptionEdit = function () {
        this.previewDescription ? (this.showDescription = true, this.previewDescription = false) : (this.showDescription = !this.showDescription, this.previewDescription = false);
    };

    MainController.prototype.updateParams = function () {
        var _this = this;
        if (this.currentRoute && this.currentRoute.route) {
            if (!this.currentRoute.routeParams)
                this.currentRoute.routeParams = {};
            var paramsRegExp = /(:.[^\/]*)/g;
            var cloneParams = this.currentRoute.route.match(paramsRegExp);
            if (cloneParams) {
                cloneParams = cloneParams.map(function (e) {
                    return e.substr(1);
                });
                cloneParams.map(function (e) {
                    _this.currentRoute.routeParams[e] = _this.currentRoute.routeParams[e] || { name: e, value: '', description: '' };
                });

                var outputObject = MainController.clone(this.currentRoute.routeParams);
                Object.keys(outputObject).map(function (e) {
                    if (cloneParams.indexOf(e) == -1)
                        delete outputObject[e];
                });

                console.log(outputObject, '000');
                this.currentRoute.routeParams = outputObject;
            } else {
                this.currentRoute.routeParams = {};
            }
        }
    };

    ///
    MainController.prototype.updateDescription = function () {
        var _this = this;
        console.log('paso');
        var paramPredocs = "#### Route\n\t" + this.currentRoute.route + '\n\n';
        var paramsDocs = "";

        paramsDocs += "\n\n#### Parameters\n";
        var keys = false;
        Object.keys(this.currentRoute.routeParams).map(function (e) {
            var elm = _this.currentRoute.routeParams[e];
            keys = true;
            paramsDocs += '* **' + elm.name + '** ' + elm.description + '\n';
        });

        console.log(paramsDocs);
        paramsDocs = !keys ? "" : paramsDocs + '\n\n';

        if (this.currentRoute.description == undefined) {
            this.currentRoute.description = "";
        }
        this.currentRoute && (this.markDownPreview = this.showdown.makeHtml(paramPredocs + this.currentRoute.description + paramsDocs));
    };

    MainController.prototype.getRouteDocumentation = function (route) {
        var paramPredocs = "#### Route\n\t" + route.route + '\n\n';
        var paramsDocs = "";

        paramsDocs += "\n\n#### Parameters\n";
        var keys = false;
        Object.keys(route.routeParams).map(function (e) {
            var elm = route.routeParams[e];
            keys = true;
            paramsDocs += '* **' + elm.name + '** ' + elm.description + '\n';
        });

        paramsDocs = !keys ? "" : paramsDocs + '\n\n';

        if (route.description == undefined) {
            route.description = "";
        }
        return paramPredocs + route.description + paramsDocs + '\n\n';
    };

    MainController.prototype.generateDocumentation = function (html) {
        var _this = this;
        var documentation = "#Documentation\n\n";
        this.config.defaultRoutes.map(function (e) {
            documentation += _this.getRouteDocumentation(e);
        });
        if (html)
            documentation = this.markDownTemplate.replace('{{code}}', this.showdown.makeHtml(documentation));
        this.download("ExpressMockerDocs" + (html ? ".html" : ".md"), documentation);
    };

    MainController.prototype.download = function (filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
    };

    MainController.prototype.previewRoute = function (current) {
        var _this = this;
        this.previewRouteVisible = !this.previewRouteVisible;

        var url = current.route;

        var paramsRegExp = /(:.[^\/]*)/g;
        var cloneParams = this.currentRoute.route.match(paramsRegExp);
        cloneParams && cloneParams.map(function (e) {
            url = url.replace(e, current.routeParams[e.substr(1)].value);
        });

        this.$http.head(url).success(function (data, status, headers, config) {
            if (headers('Content-Type').indexOf("application/json") != -1) {
                _this.$http.get(url).success(function (data, status, headers, config) {
                    _this.currentRoutePreviewMode = 0;
                    _this.currentRoutePreviewCode = JSON.stringify(data, null, '	');
                });
            } else {
                _this.currentRoutePreviewCode = "";
                _this.currentRoutePreviewMode = 1;
                _this.currentRoutePreview = url;
            }
        });
    };

    MainController.prototype.browseForFile = function () {
        (document.querySelector('#uploadFile')).click();
    };

    MainController.prototype.fileSelected = function (files) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function (e) {
            _this.currentRoute.response.source = e.target.result;
            _this.$scope.$apply();
        };

        // Read in the image file as a data URL.
        reader.readAsDataURL(files[0]);
    };

    MainController.prototype.setType = function (type) {
        switch (type) {
            case 0:
                this.currentRoute.response.source = "var jsonmocker = {\n\n}";
                break;
            case 1:
            case 2:
                this.currentRoute.response.source = "";
                this.previewRouteVisible = false;
                break;
        }
        this.currentResponseType = type;
    };

    MainController.prototype.cancel = function () {
        this.showList();
    };

    MainController.prototype.save = function () {
        if (this.currentResponseType == 0) {
            var source = this.currentRoute.response.source;
            source = source.substring(source.indexOf('{') - 1, source.lastIndexOf('}') + 1);
            source = MainController.utf8_encode(source);
            this.currentRoute.response.source = "data:application/json-mock;base64," + window.btoa(source);
        }

        if (this.editMode == MainController.MODE_ADD) {
            this.config.defaultRoutes.push(this.currentRoute);
        } else {
            this.config.defaultRoutes[this.getRouteIndex(this.currentRouteId)] = this.currentRoute;
        }
        this.saveToDisk();
        this.showList();
    };

    MainController.prototype.setCurrentVerb = function (verb) {
        //TODO
        // Find if a same route currently exists
        this.currentRoute.verb = verb;
    };

    // HELPERS
    MainController.prototype.isUndefined = function (obj) {
        return JSON.stringify(obj) === "{}" || obj === undefined;
    };

    // ported from https://github.com/NothingAgency/tetragon/tree/master/src/engine/tetragon/util/hash
    MainController.prototype.shash = function (string) {
        var value = 0;
        for (var i = 0; i < string.length; i++) {
            var cc = string.charCodeAt(i) + 96;
            value = ((value * 27) + cc) % 9999999999999999;
        }
        return value.toString(16).toUpperCase();
    };

    MainController.prototype.getRouteById = function (id) {
        var routes = this.config.defaultRoutes;
        var found = null;
        for (var i = 0, total = routes.length; i < total; i++) {
            if (routes[i].id == id) {
                found = routes[i];
                break;
            }
        }
        return found;
    };

    MainController.prototype.getRouteIndex = function (id) {
        var routes = this.config.defaultRoutes;
        var index = null;
        for (var i = 0, total = routes.length; i < total; i++) {
            if (routes[i].id == id) {
                index = i;
                break;
            }
        }
        return index;
    };

    MainController.prototype.createEditObject = function (route) {
        var clone = MainController.clone(route), isDataUrlRegExp = /^data:(.+\/(.+));base64,(.*)$/, source = clone.response.source, isFileDataUrlEncoded = isDataUrlRegExp.test(source);

        if (isFileDataUrlEncoded) {
            var dataUrlInfo = isDataUrlRegExp.exec(source), mime = dataUrlInfo[1];

            if (mime == "application/json-mock") {
                this.currentResponseType = 0;
                clone.response.source = 'var jsonmocker = ' + MainController.utf8_decode(window.atob(dataUrlInfo[3]));
            } else {
                this.currentResponseType = 1;
            }
        } else {
            this.currentResponseType = 2;
        }

        return clone;
    };

    MainController.prototype.saveToDisk = function () {
        var _this = this;
        this.reloadNeeded = true;
        this.loading = true;
        this.$http.post('/express-mocker/update', { config: JSON.parse(angular.toJson(this.config, true)) }).then(function () {
            _this.loading = false;
        });
    };

    MainController.prototype.reload = function () {
        var _this = this;
        this.loading = true;
        this.$http.get('/express-mocker/reload').then(function () {
            _this.$location.path('/list');
            _this.reloadNeeded = _this.loading = false;
            _this.loadConfig();
        });
    };

    MainController.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    MainController.utf8_encode = function (argString) {
        if (argString === null || typeof argString === "undefined") {
            return "";
        }

        var string = (argString + '');
        var utftext = '', start, end, stringl = 0;

        start = end = 0;
        stringl = string.length;
        for (var n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if ((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
            } else if ((c1 & 0xF800) != 0xD800) {
                enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
            } else {
                if ((c1 & 0xFC00) != 0xD800) {
                    throw new RangeError("Unmatched trail surrogate at " + n);
                }
                var c2 = string.charCodeAt(++n);
                if ((c2 & 0xFC00) != 0xDC00) {
                    throw new RangeError("Unmatched lead surrogate at " + (n - 1));
                }
                c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
                enc = String.fromCharCode((c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.slice(start, end);
                }
                utftext += enc;
                start = end = n + 1;
            }
        }

        if (end > start) {
            utftext += string.slice(start, stringl);
        }

        return utftext;
    };

    MainController.utf8_decode = function (str_data) {
        //  discuss at: http://phpjs.org/functions/utf8_decode/
        // original by: Webtoolkit.info (http://www.webtoolkit.info/)
        //    input by: Aman Gupta
        //    input by: Brett Zamir (http://brett-zamir.me)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Norman "zEh" Fuchs
        // bugfixed by: hitwork
        // bugfixed by: Onno Marsman
        // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // bugfixed by: kirilloid
        //   example 1: utf8_decode('Kevin van Zonneveld');
        //   returns 1: 'Kevin van Zonneveld'
        var tmp_arr = [], i = 0, ac = 0, c1 = 0, c2 = 0, c3 = 0, c4 = 0;

        str_data += '';

        while (i < str_data.length) {
            c1 = str_data.charCodeAt(i);
            if (c1 <= 191) {
                tmp_arr[ac++] = String.fromCharCode(c1);
                i++;
            } else if (c1 <= 223) {
                c2 = str_data.charCodeAt(i + 1);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                i += 2;
            } else if (c1 <= 239) {
                // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
                c2 = str_data.charCodeAt(i + 1);
                c3 = str_data.charCodeAt(i + 2);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            } else {
                c2 = str_data.charCodeAt(i + 1);
                c3 = str_data.charCodeAt(i + 2);
                c4 = str_data.charCodeAt(i + 3);
                c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
                c1 -= 0x10000;
                tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF));
                tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
                i += 4;
            }
        }

        return tmp_arr.join('');
    };
    MainController.MODE_ADD = 0;
    MainController.MODE_EDIT = 1;
    return MainController;
})();


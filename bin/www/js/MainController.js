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


///<reference path="../../../src/d.ts/DefinitelyTyped/angularjs/angular.d.ts"/>
///<reference path="JSONMocker.d.ts"/>
var MainController = (function () {
    function MainController($scope, $element, $http, $route, $routeParams, $location, $timeout, $sce) {
        var _this = this;
        this.$scope = $scope;
        this.$element = $element;
        this.$http = $http;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.$timeout = $timeout;
        this.$sce = $sce;
        this.listVisible = true;
        this.reloadNeeded = false;
        this.hasJsErrors = false;
        this.previewVisible = false;
        this.previewDescription = false;
        this.previewOutput = "";
        this.showdown = new Showdown.converter();
        this.loading = true;
        this.showDescription = true;
        this.linkPreview = false;
        this.currentRoutePreview = "";
        var timer = false;
        var timerDescription = false;
        var timerJSON = false;
        $scope.$watch('mc.currentRoute.route', function () {
            if (timer) {
                $timeout.cancel(timer);
            }

            _this.currentRoute && _this.currentRoute.route != '' && (timer = $timeout(function () {
                _this.updateParams();
            }, 500));
        });

        $scope.$watch('mc.currentRoute.response.source', function () {
            if (timerJSON) {
                $timeout.cancel(timerJSON);
            }
            if (_this.previewVisible && _this.currentRouteSwitch.fileType == 0) {
                timerJSON = $timeout(function () {
                    _this.updatePreview();
                }, 500);
            }
        });
        $scope.$watch('mc.currentRoute.description', function () {
            if (timerDescription) {
                $timeout.cancel(timerDescription);
            }
            if (_this.previewDescription) {
                timerDescription = $timeout(function () {
                    _this.updateDescription();
                }, 500);
            }
        });

        this.$scope.$on("$routeChangeSuccess", function ($currentRoute, $previousRoute) {
            var action = _this.$route.current.action;

            switch (action) {
                case "list":
                    _this.listVisible = true;
                    break;
                case "edit":
                    var id = _this.$routeParams.id;
                    _this.edit(id);
                    break;
                case "add":
                    _this.add();
                    break;
            }
        });

        this.loadConfig();
    }
    MainController.prototype.loadConfig = function () {
        var _this = this;
        this.loading = true;
        this.$http.get('/express-mocker/config.json').success(function (data, status, headers, config) {
            _this.config = data;

            _this.loading = false;
            _this.showList();
        });
    };

    MainController.prototype.toggleDescriptionPreview = function () {
        this.previewDescription = !this.previewDescription;
        if (this.previewDescription)
            this.updateDescription();
    };

    /*
    converter.makeHtml(text);
    var converter = new Showdown.converter({ extensions: 'twitter' });
    */
    MainController.prototype.updateParams = function () {
        if (this.currentRoute) {
            var paramsRegExp = /(:.[^\/]*)/g;
            var route = this.currentRoute.route;
            var foundParams = route.match(paramsRegExp);
            var paramNames;
            if (foundParams)
                paramNames = foundParams.map(function (el) {
                    return el.replace(':', '');
                });

            console.log('params', paramNames);
        }
    };

    MainController.prototype.updateDescription = function () {
        if (this.currentRoute) {
            console.log('aaa' + this.currentRoute.description, this.markDownPreview, this.showdown.makeHtml);
        }
        this.currentRoute && (this.markDownPreview = this.showdown.makeHtml(this.currentRoute.description));
    };

    MainController.prototype.radd = function () {
        this.$location.path('/add');
    };
    MainController.prototype.add = function () {
        this.showDescription = true;
        this.previewDescription = false;
        this.editMode = MainController.MODE_ADD;
        this.currentRouteSwitch = { filetype: 0 };
        this.currentRoute = { verb: 'get', active: true, route: '', response: { source: '' } };
        this.listVisible = false;
        this.setType(0);
    };
    MainController.prototype.redit = function (id) {
        this.$location.path('/edit/' + id);
    };
    MainController.prototype.edit = function (id) {
        this.showDescription = false;
        this.previewDescription = false;
        this.editMode = MainController.MODE_EDIT;
        this.currentRoute = this.createEditObject(this.config.defaultRoutes[id]);
        this.currentRouteId = id;
        this.listVisible = false;
    };

    MainController.prototype.delete = function (id) {
        var itemToDelete = this.config.defaultRoutes[id];
        var itemPos = this.config.defaultRoutes.indexOf(itemToDelete);
        this.config.defaultRoutes.splice(itemPos, 1);
        this.saveToDisk();
        this.showList();
    };

    MainController.prototype.toggleActive = function (idx) {
        this.config.defaultRoutes[idx].active = !this.config.defaultRoutes[idx].active;
        this.saveToDisk();
    };

    MainController.prototype.createEditObject = function (source) {
        this.currentRouteSwitch = {};
        var clone = MainController.clone(source);
        var cloneParams = clone.route.match(/(:[^\/]*)/g);
        cloneParams && (clone.routeParams = cloneParams.map(function (el) {
            return el.replace(':', '');
        }));

        var isDataUrlRegExp = /^data:(.+\/(.+));base64,(.*)$/, source = clone.response.source, isFileDataUrlEncoded = isDataUrlRegExp.test(source);

        if (isFileDataUrlEncoded) {
            var dataUrlInfo = isDataUrlRegExp.exec(source), mime = dataUrlInfo[1];

            if (mime == "application/json-mock") {
                this.currentRouteSwitch.fileType = 0;
                clone.response.source = 'var jsonmocker = ' + utf8_decode(window.atob(dataUrlInfo[3]));
            } else {
                this.currentRouteSwitch.fileType = 1;
            }
        } else {
            this.currentRouteSwitch.fileType = 2;
        }

        return clone;
    };

    MainController.prototype.previewRoute = function (route) {
        console.log(route);
        this.linkPreview = true;
        this.$sce.trustAsHtml(route);
        this.currentRoutePreview = this.$sce.getTrustedHtml(route);
    };

    MainController.prototype.preview = function () {
        this.previewVisible = !this.previewVisible;
        this.previewVisible && this.updatePreview();
    };
    MainController.prototype.updatePreview = function () {
        console.log('updatePreview');
        var jsminCode = jsmin(this.currentRoute.response.source, 3);
        var code;
        try  {
            code = eval("'use strict';var context = " + jsminCode.split('var jsonmocker=')[1] + ";context");
            this.noValidJSONMockupCode = false;

            this.previewOutput = JSON.stringify(es.xperiments.json.JSONMocker.parseTemplate(code, {}), null, '    ');
        } catch (e) {
            if (e instanceof SyntaxError) {
                this.noValidJSONMockupCode = true;
            }
        }
    };

    MainController.prototype.uploadFile = function (files) {
        var _this = this;
        // Loop through the FileList and render image files as thumbnails.
        var f = files[0];
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function (e) {
            _this.currentRoute.response.source = e.target.result;
            _this.$scope.$apply();
        };

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    };

    MainController.prototype.setType = function (type) {
        switch (type) {
            case 0:
                this.currentRoute.response.source = "var jsonmocker = {\n\n}";
                break;
            case 1:
                break;
            case 2:
                this.currentRoute.response.source = "";
                this.previewVisible = false;
                break;
        }
        this.currentRouteSwitch.fileType = type;
    };

    // edit
    MainController.prototype.cancel = function () {
        this.showList();
    };

    MainController.prototype.save = function () {
        if (this.editMode == MainController.MODE_ADD) {
            this.config.defaultRoutes.push(this.currentRoute);
        } else {
            console.log(this.currentRouteSwitch.fileType);
            if (this.currentRouteSwitch.fileType == 0) {
                var source = this.currentRoute.response.source;
                source = source.substring(source.indexOf('{') - 1, source.lastIndexOf('}') + 1);
                console.log(source);

                //source = JSON.stringify(JSON.parse(source));
                console.log(source);
                source = utf8_encode(source);
                this.currentRoute.response.source = "data:application/json-mock;base64," + window.btoa(source);
            }

            this.config.defaultRoutes[this.currentRouteId] = this.currentRoute;
        }
        this.saveToDisk();
        this.showList();
    };

    MainController.prototype.showList = function () {
        this.$location.path('/list');
        this.listVisible = true;
    };

    MainController.prototype.setCurrentVerb = function (verb) {
        //TODO
        // Find if a same route currently exists
        this.currentRoute.verb = verb;
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
    MainController.prototype.browseForFile = function () {
        (document.querySelector('#uploadFile')).click();
    };
    MainController.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
    MainController.MODE_ADD = 0;
    MainController.MODE_EDIT = 1;
    return MainController;
})();

function utf8_encode(argString) {
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
}

function utf8_decode(str_data) {
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
}

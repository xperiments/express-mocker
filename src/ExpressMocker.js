///<reference path="d.ts/DefinitelyTyped/node/node.d.ts"/>
///<reference path="d.ts/DefinitelyTyped/express/express.d.ts"/>
///<reference path="JSONMocker.d.ts"/>
var $NodeStorage = require('../node_modules/dom-storage/lib/index');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

var express = require('express');
var vm = require('vm');
var fs = require('fs');

var jsonmocker = require("./JSONMocker");
jsonmocker;
var JSONMocker = jsonmocker.es.xperiments.json.JSONMocker;

(function (es) {
    (function (xperiments) {
        (function (nodejs) {
            (function (ExpressMockerResponseType) {
                ExpressMockerResponseType[ExpressMockerResponseType["DATA_URL"] = 0] = "DATA_URL";
                ExpressMockerResponseType[ExpressMockerResponseType["FILE"] = 1] = "FILE";
                ExpressMockerResponseType[ExpressMockerResponseType["JSON_GEN"] = 2] = "JSON_GEN";
            })(nodejs.ExpressMockerResponseType || (nodejs.ExpressMockerResponseType = {}));
            var ExpressMockerResponseType = nodejs.ExpressMockerResponseType;

            function mix() {
                var rest = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    rest[_i] = arguments[_i + 0];
                }
                var i, total, j, newObj = {};

                for (i = 0, total = arguments.length; i < total; i++) {
                    for (j in arguments[i]) {
                        if (arguments[i].hasOwnProperty(j)) {
                            newObj[j] = arguments[i][j];
                        }
                    }
                }
                return newObj;
            }
            nodejs.mix = mix;

            var ExpressMocker = (function () {
                function ExpressMocker(npmDir, rootDir) {
                    this.npmDir = npmDir;
                    this.rootDir = rootDir;
                }
                ExpressMocker.prototype.loadConfig = function (path) {
                    this.configPath = path;

                    this.config = JSON.parse(fs.readFileSync(path, 'utf8'));

                    //admin route
                    var adminRoute = {
                        hidden: true,
                        active: true,
                        verb: "get",
                        route: "/express-mocker/config.json",
                        response: {
                            source: "config.json"
                        }
                    };

                    if (this.config.adminAuth) {
                        adminRoute.basicAuth = this.config.adminAuth;
                    }

                    // add admin routes
                    this.config.defaultRoutes.push(adminRoute);
                    ExpressMocker.quiet = this.config.quiet;
                    return this;
                };

                ExpressMocker.prototype.setPort = function (port) {
                    if (this.config && port != 0)
                        this.config.port = port;
                    return this;
                };
                ExpressMocker.prototype.setQuiet = function (mode) {
                    if (ExpressMocker.quiet != mode) {
                        ExpressMocker.quiet = mode;
                    }
                    return this;
                };
                ExpressMocker.prototype.createServer = function () {
                    var _this = this;
                    this.express = express();
                    this.express.use(express.urlencoded());
                    this.express.use(express.json());
                    this.express.use(this.corsMiddleware.bind(this));
                    this.express.use(express.static(__dirname));

                    // error that raises when port is already in use
                    process.on('uncaughtException', function (err) {
                        if (err.errno === 'EADDRINUSE')
                            ExpressMocker.log('Port', _this.config.port, 'is alrready in use!!');
else
                            ExpressMocker.log(err);
                        process.exit(1);
                    });

                    this.storage = new $NodeStorage(this.rootDir + '/express-mocker/express-mocker.db');
                    this.configureRoutes();
                    this.configureAdmin();
                    this.configureStatics();
                    this.express.listen(this.config.port);
                    ExpressMocker.log('Starting server at port:', this.config.port);
                };

                ExpressMocker.prototype.getInjector = function () {
                    var injector = new Injector();
                    injector.register('$localStorage', this.storage);
                    injector.register('$console', (function () {
                        return console;
                    })());
                    injector.register('$helper', jsonmocker.es.xperiments.json.MicroJSONGenHelper);
                    return injector;
                };
                ExpressMocker.prototype.configureStatics = function () {
                    var _this = this;
                    if (this.config.statics) {
                        this.config.statics.map(function (staticDir) {
                            ExpressMocker.log(staticDir.route, _this.rootDir + staticDir.directory);
                            _this.express.use(staticDir.route, express.static(_this.rootDir + staticDir.directory));
                        });
                    }
                };

                ExpressMocker.prototype.configureAdmin = function () {
                    var _this = this;
                    this.express.post('/express-mocker/update', function (req, res) {
                        fs.writeFileSync(_this.configPath, JSON.stringify(req.body.config, null, 4), 'utf8');
                        res.send("ok");
                    });

                    this.express.all("/express-mocker/reload", function (req, res) {
                        // wipe out all the old routes, or express will get confused.
                        var verbs = Object.keys(_this.express.routes);
                        verbs.map(function (verb) {
                            _this.express.routes[verb] = [];
                        });
                        _this.loadConfig(_this.configPath);
                        _this.configureRoutes();
                        _this.configureAdmin();
                        _this.configureStatics();

                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end('{"configPath": "' + _this.configPath + '", "reloaded": "true"}');
                    });

                    this.config.adminAuth && this.express.get('/express-mocker/*', express.basicAuth(function (username, password, callback) {
                        var result = ((username === _this.config.adminAuth.login) && (password === _this.config.adminAuth.password));
                        callback(null, result);
                    }), function (req, res, next) {
                        next();
                    });

                    // default admin code is located at (installed pkg dir)/bin/www
                    this.express.use('/express-mocker', express.static(this.npmDir + '/www'));
                };

                ExpressMocker.prototype.configureRoutes = function () {
                    var _this = this;
                    //add all active routes
                    this.config.defaultRoutes.map(function (e) {
                        if (e.active || e.hidden)
                            _this.addRoute(e);
                    });
                };

                ExpressMocker.prototype.addRoute = function (route) {
                    var _this = this;
                    if (!route.hidden)
                        ExpressMocker.log('Add route', route.verb.toUpperCase(), route.route);

                    // add routing
                    this.express[route.verb](route.route, function (req, res) {
                        _this.sendResponse(req, res, route);
                    });
                };

                ExpressMocker.prototype.sendResponse = function (req, res, route) {
                    var _this = this;
                    var isDataUrlRegExp = /^data:(.+\/(.+));base64,(.*)$/, isJsonGeneratorFileRegExp = /\.json-mk$/, source = route.response.source, isFileDataUrlEncoded = isDataUrlRegExp.test(source), isJsonGeneratorFile = isJsonGeneratorFileRegExp.test(source), isFile = !isFileDataUrlEncoded;

                    switch (true) {
                        case isFileDataUrlEncoded:
                            var dataUrlInfo = isDataUrlRegExp.exec(source), mime = dataUrlInfo[1], outputBuffer = Base64.decode(dataUrlInfo[3]);

                            if (mime != "application/json-mock") {
                                // send the mine/base64 response from the buffer
                                var len = Buffer.byteLength(jsonGenResult.result, 'utf8');
                                this.sendContentLength(res, mime, len, 'utf8');
                                res.send(outputBuffer);
                            } else {
                                // process JSONMock template from the base64 encoded buffer
                                var jsonGenResult = this.parseJSONGen(outputBuffer, route, req, res);
                                var len = Buffer.byteLength(jsonGenResult.result, 'utf8');
                                this.sendContentLength(res, jsonGenResult.directResponse ? jsonGenResult.mime : "application/json", len, 'utf8');
                                res.send(jsonGenResult.result);
                            }

                            break;

                        case isJsonGeneratorFile:
                            // read the file from disk
                            fs.readFile(this.rootDir + '/express-mocker/' + source, { encoding: "utf8" }, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                                res.header('Content-Type', "application/json");

                                // process JSONMock template from the contents of the file
                                res.send(_this.parseJSONGen(data.toString('utf8'), route, req, res).result);
                            });

                            break;

                        default:
                            //let express serve the file 4 us ;-)
                            res.sendfile(source, { root: this.rootDir + '/express-mocker' });
                            break;
                    }
                };

                ExpressMocker.prototype.parseJSONGen = function (data, route, req, res) {
                    var dataUrlRegExp = /^data:(.+\/(.+));base64,(.*)$/;

                    // create
                    var sandbox = { code: null };

                    try  {
                        vm.runInNewContext('code = ' + data.substring(data.indexOf('{')), sandbox);
                    } catch (e) {
                        ExpressMocker.log('Error executing fjson code ' + e);
                    }
                    var injector = this.getInjector();
                    var template = new JSONMocker().parseTemplate(sandbox.code, { request: req }, injector);
                    injector.dispose();
                    injector = null;

                    if (template.$content && dataUrlRegExp.test(template.$content) && (Object.keys(JSON.parse(JSON.stringify(template))).length == 1)) {
                        var dataUrlInfo = dataUrlRegExp.exec(template.$content);
                        var output = Base64.decode(dataUrlInfo[3]);
                        return {
                            result: output,
                            directResponse: true,
                            mime: dataUrlInfo[1]
                        };
                    }
                    return {
                        result: JSON.stringify(template),
                        directResponse: false
                    };
                };

                ExpressMocker.prototype.sendContentLength = function (res, contentType, len, charset) {
                    if (typeof charset === "undefined") { charset = ''; }
                    res.header('Cache-Control', 'no-cache');
                    res.header('Content-Type', contentType + (charset != "" ? '; charset=' + charset : ''));
                    res.header('Content-Length', len.toString());
                };

                ExpressMocker.prototype.corsMiddleware = function (req, res, next) {
                    res.header('Access-Control-Allow-Origin', "*");
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    next();
                };

                ExpressMocker.log = function () {
                    var rest = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        rest[_i] = arguments[_i + 0];
                    }
                    if (!ExpressMocker.quiet) {
                        console.log.apply(console, rest);
                    }
                };
                return ExpressMocker;
            })();
            nodejs.ExpressMocker = ExpressMocker;

            var Base64 = (function () {
                function Base64() {
                }
                Base64.encode = function (stringToEncode) {
                    return new Buffer(stringToEncode, 'utf8').toString('base64');
                };

                Base64.decode = function (buffer) {
                    return new Buffer(buffer, 'base64').toString('utf8');
                };
                return Base64;
            })();

            var Injector = (function () {
                function Injector() {
                    this.dependencies = {};
                }
                Injector.getArgs = function (target) {
                    return target.toString().match(Injector.FN_ARGS)[1].split(',').map(function (e) {
                        return e.trim();
                    });
                };

                Injector.prototype.hasDependencies = function (target) {
                    return this.getDependencies(Injector.getArgs(target)).length > 0;
                };

                /// a,b,c,$firstdependency,secondDep...
                Injector.prototype.processCall = function (target, argv) {
                    var args = Injector.getArgs(target.toString());
                    var params = Array.prototype.slice.call(arguments).slice(1);
                    var injections = this.getDependencies(args);
                    return target.apply(target, argv.concat(injections));
                };
                Injector.prototype.process = function (target) {
                    var args = Injector.getArgs(target.toString());
                    return target.apply(target, this.getDependencies(args));
                };

                Injector.prototype.getDependencies = function (arr) {
                    var _this = this;
                    return arr.map(function (value) {
                        return _this.dependencies[value];
                    }).filter(function (e) {
                        return e !== undefined;
                    });
                };

                Injector.prototype.register = function (name, dependency) {
                    this.dependencies[name] = dependency;
                };

                Injector.prototype.dispose = function () {
                    this.dependencies = null;
                };
                Injector.FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
                Injector.FN_ARG_SPLIT = /,/;
                Injector.FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
                Injector.STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                return Injector;
            })();
            nodejs.Injector = Injector;
        })(xperiments.nodejs || (xperiments.nodejs = {}));
        var nodejs = xperiments.nodejs;
    })(es.xperiments || (es.xperiments = {}));
    var xperiments = es.xperiments;
})(exports.es || (exports.es = {}));
var es = exports.es;


///<reference path="d.ts/DefinitelyTyped/node/node.d.ts"/>
///<reference path="d.ts/DefinitelyTyped/express/express.d.ts"/>
///<reference path="JSONMocker.d.ts"/>
var express = require('express');
var fs = require('fs');
var jsonmocker = require("./JSONMocker");
jsonmocker;
var JSONMocker = jsonmocker.JSONMocker;
var Pool = jsonmocker.Pool;
var logger = require("./ExpressLogger");
logger;
var Logger = logger.ExpressLogger;

(function (ExpressMockerResponseType) {
    ExpressMockerResponseType[ExpressMockerResponseType["DATA_URL"] = 0] = "DATA_URL";
    ExpressMockerResponseType[ExpressMockerResponseType["FILE"] = 1] = "FILE";
    ExpressMockerResponseType[ExpressMockerResponseType["JSON_GEN"] = 2] = "JSON_GEN";
})(exports.ExpressMockerResponseType || (exports.ExpressMockerResponseType = {}));
var ExpressMockerResponseType = exports.ExpressMockerResponseType;

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



var ExpressMocker = (function () {
    function ExpressMocker(npmDir, rootDir) {
        this.npmDir = npmDir;
        this.rootDir = rootDir;
        this.JSONMockerPool = new Pool(JSONMocker, 100);
    }
    ExpressMocker.prototype.loadConfig = function (path) {
        this.configPath = path;

        this.config = JSON.parse(fs.readFileSync(path, 'utf8'));

        //config.json file route
        var adminRoute = {
            id: this.shash('/express-mocker/config.json'),
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

        // set quiet mode
        Logger.quiet = this.config.quiet;

        return this;
    };

    ExpressMocker.prototype.setPort = function (port) {
        if (this.config && port != 0)
            this.config.port = port;
        return this;
    };

    ExpressMocker.prototype.getPort = function () {
        return this.config.port;
    };
    ExpressMocker.prototype.setQuiet = function (mode) {
        if (Logger.quiet != mode) {
            Logger.quiet = mode;
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
                Logger.error('Port', _this.config.port, 'is alrready in use!!');
else
                Logger.error(err);
            process.exit(1);
        });

        this.configureRoutes();
        this.configureAdmin();
        this.configureStatics();
        this.expressListener = this.express.listen(this.config.port);
        Logger.success('[Express Mocker] Starting server [ @pid:', process.pid, '] at port:', this.config.port);
        return this;
    };

    ExpressMocker.prototype.configureStatics = function () {
        var _this = this;
        if (this.config.statics) {
            this.config.statics.map(function (staticDir) {
                if (fs.existsSync(_this.rootDir + staticDir.directory)) {
                    Logger.success('Mapping route:', staticDir.route, 'to:', _this.rootDir + staticDir.directory);
                    _this.express.use(staticDir.route, express.static(_this.rootDir + staticDir.directory));
                } else {
                    Logger.error('Error Mapping route:', staticDir.route, 'to:', _this.rootDir + staticDir.directory);
                }
            });
        }
    };

    ExpressMocker.prototype.configureAdmin = function () {
        var _this = this;
        this.express.get('/express-mocker/stop-server', function (req, res) {
            res.send('{"code":100}');
            Logger.success('Closing..');
            _this.expressListener.close();
        });

        this.express.post('/express-mocker/update', function (req, res) {
            fs.writeFileSync(_this.configPath, JSON.stringify(req.body.config, null, 4), 'utf8');
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end('{"code":100}');
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
            Logger.info('Add route', route.verb.toUpperCase(), route.route);

        // add routing
        this.express[route.verb](route.route, function (req, res) {
            _this.sendResponse(req, res, route);
        });
    };

    ExpressMocker.prototype.sendResponse = function (req, res, route) {
        var _this = this;
        Logger.info('Processing route:', route.route);
        var isDataUrlRegExp = /^data:(.+\/(.+));base64,(.*)$/, isJsonGeneratorFileRegExp = /\.json-mk$/, source = route.response.source, isFileDataUrlEncoded = isDataUrlRegExp.test(source), isJsonGeneratorFile = isJsonGeneratorFileRegExp.test(source), isFile = !isFileDataUrlEncoded;

        switch (true) {
            case isFileDataUrlEncoded:
                var dataUrlInfo = isDataUrlRegExp.exec(source), mime = dataUrlInfo[1];

                if (mime != "application/json-mock") {
                    // send the mine/base64 response from the buffer
                    var buffer = Base64.decodeBuffer(dataUrlInfo[3]);
                    var len = Buffer.byteLength(buffer.toString('utf8'), 'utf8');
                    this.sendContentLength(res, mime, len);
                    res.send(buffer);
                } else {
                    var outputBuffer = Base64.decode(dataUrlInfo[3]);

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
        var jsonmocker = this.JSONMockerPool.pop();
        var template = jsonmocker.parseTemplate(data, mix(req.params, req.body));
        this.JSONMockerPool.push(jsonmocker);

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

    // HELPERS
    ExpressMocker.prototype.shash = function (string) {
        var value = 0;
        for (var i = 0; i < string.length; i++) {
            var cc = string.charCodeAt(i) + 96;
            value = ((value * 27) + cc) % 9999999999999999;
        }
        return value.toString(16).toUpperCase();
    };
    return ExpressMocker;
})();
exports.ExpressMocker = ExpressMocker;

var Base64 = (function () {
    function Base64() {
    }
    Base64.encode = function (stringToEncode) {
        return new Buffer(stringToEncode, 'utf8').toString('base64');
    };

    Base64.decode = function (buffer) {
        return new Buffer(buffer, 'base64').toString('utf8');
    };
    Base64.decodeBuffer = function (buffer) {
        return new Buffer(buffer, 'base64');
    };
    return Base64;
})();


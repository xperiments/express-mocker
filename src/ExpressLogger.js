var ExpressLogger = (function () {
    function ExpressLogger() {
    }
    ExpressLogger.print = function (color, rest) {
        if (!ExpressLogger.quiet)
            console.log.apply(console, ['[Express Mocker]'].concat(rest).map(function (e) {
                return ExpressLogger.color(color, e);
            }));
    };
    ExpressLogger.log = function () {
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            rest[_i] = arguments[_i + 0];
        }
        ExpressLogger.print('black', rest);
    };
    ExpressLogger.info = function () {
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            rest[_i] = arguments[_i + 0];
        }
        ExpressLogger.print('cyan', rest);
    };
    ExpressLogger.error = function () {
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            rest[_i] = arguments[_i + 0];
        }
        ExpressLogger.print('red', rest);
    };
    ExpressLogger.success = function () {
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            rest[_i] = arguments[_i + 0];
        }
        ExpressLogger.print('green', rest);
    };

    ExpressLogger.color = function (color, text) {
        if (!Object.keys(ExpressLogger.colors).indexOf(color))
            return text;
        return [ExpressLogger.colors[color], text, "\x1b[0m"].join('');
    };
    ExpressLogger.colors = {
        'black': '\033[30m',
        'red': '\033[31m',
        'green': '\033[32m',
        'yellow': '\033[33m',
        'blue': '\033[34m',
        'magenta': '\033[35m',
        'cyan': '\033[36m',
        'white': '\033[37m'
    };
    ExpressLogger.quiet = false;
    return ExpressLogger;
})();
exports.ExpressLogger = ExpressLogger;


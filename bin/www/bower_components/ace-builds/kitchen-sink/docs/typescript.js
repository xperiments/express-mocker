var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Greeter = (function () {
    function Greeter(message) {
        this.greeting = message;
    }
    Greeter.prototype.greet = function () {
        return "Hello, " + this.greeting;
    };
    return Greeter;
})();

var greeter = new Greeter("world");

var button = document.createElement('button');
button.innerText = "Say Hello";
button.onclick = function () {
    alert(greeter.greet());
};

document.body.appendChild(button);

var Snake = (function (_super) {
    __extends(Snake, _super);
    function Snake() {
        _super.apply(this, arguments);
    }
    Snake.prototype.move = function () {
        alert("Slithering...");
        _super.prototype(5);
    };
    return Snake;
})(Animal);

var Horse = (function (_super) {
    __extends(Horse, _super);
    function Horse() {
        _super.apply(this, arguments);
    }
    Horse.prototype.move = function () {
        alert("Galloping...");
        _super.prototype.move.call(this, 45);
    };
    return Horse;
})(Animal);

var Sayings;
(function (Sayings) {
    var Greeter = (function () {
        function Greeter(message) {
            this.greeting = message;
        }
        Greeter.prototype.greet = function () {
            return "Hello, " + this.greeting;
        };
        return Greeter;
    })();
    Sayings.Greeter = Greeter;
})(Sayings || (Sayings = {}));
var Mankala;
(function (Mankala) {
    var Features = (function () {
        function Features() {
            this.turnContinues = false;
            this.seedStoredCount = 0;
            this.capturedCount = 0;
            this.spaceCaptured = NoSpace;
        }
        Features.prototype.clear = function () {
            this.turnContinues = false;
            this.seedStoredCount = 0;
            this.capturedCount = 0;
            this.spaceCaptured = NoSpace;
        };

        Features.prototype.toString = function () {
            var stringBuilder = "";
            if (this.turnContinues) {
                stringBuilder += " turn continues,";
            }
            stringBuilder += " stores " + this.seedStoredCount;
            if (this.capturedCount > 0) {
                stringBuilder += " captures " + this.capturedCount + " from space " + this.spaceCaptured;
            }
            return stringBuilder;
        };
        return Features;
    })();
    Mankala.Features = Features;
})(Mankala || (Mankala = {}));

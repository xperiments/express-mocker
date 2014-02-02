var Pool = (function () {
    function Pool(type, len) {
        this.pool = [];
        this.counter = len;

        var i = len;
        while (--i > -1)
            this.pool[i] = new type();

        return this;
    }
    Pool.prototype.pop = function () {
        if (this.counter > 0)
            return this.pool[--this.counter];
else
            throw new Error("You exhausted the pool!");
    };

    Pool.prototype.push = function (s) {
        this.pool[this.counter++] = s;
    };
    return Pool;
})();
exports.Pool = Pool;

var TestPoolClass = (function () {
    function TestPoolClass() {
    }
    TestPoolClass.prototype.juan = function () {
    };
    return TestPoolClass;
})();
exports.TestPoolClass = TestPoolClass;

var pool = new Pool(TestPoolClass, 100);
pool.pop().juan();


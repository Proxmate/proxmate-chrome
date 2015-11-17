(function () {
    var Browser, Storage;

    Browser = require('./browser').Browser;

    Storage = (function () {
        function Storage() {
        }

        Storage.prototype.internStorage = {};

        Storage.prototype.copyInterval = null;

        Storage.prototype.init = function (callback) {
            return this.copyFromChromeStorage((function (_this) {
                return function () {
                    var globalStatus;
                    globalStatus = _this.internStorage['proxmate_global_status'];
                    if (globalStatus == null) {
                        _this.internStorage['proxmate_global_status'] = true;
                    }
                    return callback(_this.internStorage);
                };
            })(this));
        };


        /**
         * Writes the RAM storage into chrome HDD storage, after a 1 second delay
         */

        Storage.prototype.copyIntoChromeStorage = function () {
            clearTimeout(this.copyInterval);
            return this.copyInterval = setTimeout((function (_this) {
                return function () {
                    return Browser.writeIntoStorage(_this.internStorage);
                };
            })(this), 1000);
        };

        /**
         * Retrieves the chrome HDD storage into RAM storage
         */

        Storage.prototype.copyFromChromeStorage = function (callback) {
            return Browser.retrieveFromStorage(null, (function (_this) {
                return function (object) {
                    _this.internStorage = object;
                    return callback();
                };
            })(this));
        };


        /**
         * Deletes all content from RAM storage
         */

        Storage.prototype.flush = function () {
            return this.internStorage = {};
        };


        /**
         * Returns value for 'key' from Storage
         * @return {String|Array} the value inside the storage
         */

        Storage.prototype.get = function (key) {
            return this.internStorage[key];
        };


        /**
         * Sets 'value' for 'key' in storage
         */

        Storage.prototype.set = function (key, value) {
            this.internStorage[key] = value;
            return this.copyIntoChromeStorage();
        };


        /**
         * Deletes a key from storage
         * @param  {String} key key to remove
         */

        Storage.prototype.remove = function (key) {
            delete this.internStorage[key];
            Browser.removeFromStorage(key);
            return this.copyIntoChromeStorage();
        };

        return Storage;

    })();

    exports.Storage = new Storage();

}).call(this);
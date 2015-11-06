(function () {
    var Config, configJson;

    configJson = require('../proxmate.json');

    Config = (function () {
        function Config() {
        }

        Config.prototype.config = {};

        Config.prototype.init = function () {
            return this.config = configJson;
        };


        /**
         * Return config content for key 'key'
         * @param  {String} key the key
         * @return {Mixed}     Whatever is written in the config
         */

        Config.prototype.get = function (key) {
            return this.config[key];
        };

        return Config;

    })();

    exports.Config = new Config();

}).call(this);
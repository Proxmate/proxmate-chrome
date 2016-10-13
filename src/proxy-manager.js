(function () {
    var Browser, ProxyManager;

    ProxyManager = (function () {
        function ProxyManager() {
        }

        ProxyManager.prototype.init = function () {
            Browser = require('./browser').Browser;
        };


        /**
         * Parses a routing config and returns a usable joined proxy string
         * @param  {Object} config the config to use
         * @return {String}        the proxy string
         */

        ProxyManager.prototype.parseRoutingConfig = function (config) {
            var configStrings, containElement, _i, _len, _ref;
            configStrings = [];
            if (config.startsWith.length > 0) {
                configStrings.push("shExpMatch(url, " + (JSON.stringify(config.startsWith + "*").replace(/"/g, "'")) + ")");
            }
            if (config.contains.length > 0) {
                _ref = config.contains;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    containElement = _ref[_i];
                    configStrings.push("url.indexOf(" + (JSON.stringify(containElement).replace(/"/g, "'")) + ") != -1");
                }
            }
            if (config.host.length > 0) {
                configStrings.push("host == " + (JSON.stringify(config.host).replace(/"/g, "'")));
            }
            return "(" + (configStrings.join(' && ')) + ")";
        };


        /**
         * Generatea and scrumbles the available servers
         * @param  {Array} serverArray the array of servers to join
         * @return {String}             the serverString
         */

        ProxyManager.prototype.generateAndScrumbleServerString = function (serverArray) {
            var i, j, _i, _ref, _ref1;

            // only one server
            if (serverArray.length == 1) {
                return "" + (serverArray.join('; '));
            }

            // multiple servers
            for (i = _i = _ref = serverArray.length - 1; _ref <= 1 ? _i <= 1 : _i >= 1; i = _ref <= 1 ? ++_i : --_i) {
                j = Math.floor(Math.random() * (i + 1));
                _ref1 = [serverArray[j], serverArray[i]], serverArray[i] = _ref1[0], serverArray[j] = _ref1[1];
            }

            return "" + (serverArray.join('; '));
        };


        /**
         * Generates a usable proxy autoconfig script based on provided servers and packages
         * @param  {Array} packages array out of package objects
         * @param  {Array} servers  array out of server objects
         * @return {String}         The usable script
         */

        ProxyManager.prototype.generateProxyAutoconfigScript = function (packages, servers) {
            var conditions, configLines, country, countryServersMapping, i, parsedRules, pkg, route, server, statement, _i, _j, _k, _len, _len1, _len2, _ref;
            countryServersMapping = {};
            for (_i = 0, _len = servers.length; _i < _len; _i++) {
                server = servers[_i];
                if (!(server.country in countryServersMapping)) {
                    countryServersMapping[server.country] = [];
                }
                countryServersMapping[server.country].push("" + server.return_type + " " + server.host + ":" + server.port);
            }
            parsedRules = {};
            for (_j = 0, _len1 = packages.length; _j < _len1; _j++) {
                pkg = packages[_j];
                if (pkg.country in countryServersMapping) {
                    if (!(pkg.country in parsedRules)) {
                        parsedRules[pkg.country] = [];
                    }
                    _ref = pkg.routing;
                    for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
                        route = _ref[_k];
                        parsedRules[pkg.country].push(this.parseRoutingConfig(route));
                    }
                }
            }
            configLines = [];
            i = 0;
            for (country in countryServersMapping) {
                servers = countryServersMapping[country];
                statement = 'else if';
                if (i === 0) {
                    statement = 'if';
                }
                if (parsedRules[country] != null) {
                    conditions = "" + (parsedRules[country].join(' || '));
                    configLines.push("" + statement + " (" + conditions + ") { return " + (JSON.stringify(this.generateAndScrumbleServerString(servers)).replace(/"/g, "'")) + " }");
                    i += 1;
                }
            }
            configLines.push("else { return 'DIRECT'; }");
            return "function FindProxyForURL(url, host) {" + (configLines.join(' ')) + "}";
        };

        /**
         * Sets browser wide proxy to autoconfig
         * @param {String}   pacScript the autoconfig string
         * @param {Function} callback  callback to execute after
         */

        ProxyManager.prototype.setProxyAutoconfig = function (pacScript, callback) {
            return Browser.setProxyAutoconfig(pacScript, callback);
        };


        /**
         * Removes all custom proxies and resets to system
         * @param  {Function} callback callback
         */

        ProxyManager.prototype.clearProxy = function (callback) {
            return Browser.clearProxy();
        };

        return ProxyManager;

    })();

    exports.ProxyManager = new ProxyManager();

}).call(this);
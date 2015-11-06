(function () {
    var Browser, PackageManager, ProxyManager, Runtime, ServerManager, Storage, Config, Status, MessageManager;

    PackageManager = require('./package-manager').PackageManager;
    ServerManager = require('./server-manager').ServerManager;
    ProxyManager = require('./proxy-manager').ProxyManager;
    Storage = require('./storage').Storage;
    Browser = require('./browser').Browser;
    Config = require('./config').Config;
    Status = require('./status').Status;
    MessageManager = require('./message-manager').MessageManager;

    // we need to set the listeners before any
    chrome.runtime.onInstalled.addListener(
        function (data) {
            window.localStorage["version"] = 'u' + chrome.runtime.getManifest().version;
            if (data.reason == 'install') {
                window.localStorage["is_install"] = true;
                window.localStorage["version"] = chrome.runtime.getManifest().version;
            }
        });

    Runtime = (function () {
        function Runtime() {
        }

        Runtime.prototype.is_install = function (callback) {
            var server, uninstallUrl;
            server = Config.get('primary_server');
            uninstallUrl = "" + server + "remove/";
            Browser.setUninstallURL(uninstallUrl);
            Browser.createTab('pages/install/index.html')
        };

        Runtime.prototype.is_update = function (callback) {
            var self = this, is_update;
            Storage.set('is_update', true)
            self.requestActivation("", function (data) {
                self.activatePlugin(data.api_key,
                    function (data) {
                        Storage.set('is_update', '')
                    })
            })
        };

        Runtime.prototype.init = function () {
            var api_key, self = this, is_update;
            is_update = Storage.get('is_update');
            api_key = Storage.get('api_key');
            Storage.remove('proxmate_server_config');
            if (api_key) {
                Browser.setPopup("pages/popup/index.html");
            } else if (window.localStorage["is_install"]) {
                self.is_install(function () {
                })
            } else {
                self.is_update(function () {
                })
            }
        };

        Runtime.prototype.requestActivation = function (email, callback) {
            var api_key, server, is_update, requestActivationUrl;
            server = Config.get('primary_server');
            is_update = Storage.get('is_update');

            requestActivationUrl = "" + server + "api/user/activation/require/?api_v=" + window.localStorage["version"];

            Browser.ajax.POST(
                requestActivationUrl,
                {
                    email: email,
                    browser: 'Chrome',
                    is_update: is_update
                },
                function (data) {
                    Storage.set('activation_link', data.activation_link);
                    return callback(data);
                }
            );
        };

        Runtime.prototype.activatePlugin = function (key, callback) {
            var server, requestActivationUrl, uninstallUrl, self;
            self = this;
            server = Config.get('primary_server');
            requestActivationUrl = "" + server + "api/user/confirm/" + key + '/?api_v=' + window.localStorage["version"];
            uninstallUrl = "" + server + "uninstall/" + key + '/';
            Browser.xhr(requestActivationUrl, 'GET', function (data) {
                if (!data.success) {
                    return callback(data)
                }
                Storage.set('activation_link', "")
                Storage.set('api_key', key);
                Status.update()
                Browser.setPopup("pages/popup/index.html");
                Browser.setUninstallURL(uninstallUrl);
                self.restart();
                return callback(data);
            });
        };

        /**
         * Update the app. Retrieves servers and sets pac
         */

        Runtime.prototype.checkApi = function () {
            var apiKey;
            apiKey = Storage.get('api_key');
            if (!apiKey) {
                Browser.createTab('pages/install/index.html')
            }
        };


        /**
         * Starts the app. Retrieves servers and sets pac
         */

        Runtime.prototype.start = function () {
            var globalStatus, pac, packages, servers;
            globalStatus = Storage.get('proxmate_global_status');
            if (!globalStatus) {
                this.stop();
                return;
            }
            Browser.setIcon("ressources/images/icon48.png");

            chrome.browserAction.onClicked.addListener(this.checkApi)

            packages = PackageManager.getInstalledPackages();

            MessageManager.get();
            servers = ServerManager.getServers();

            if (packages.length === 0 || servers.length === 0) {
                if (packages.length === 0) {
                    return;
                }
            } else {
                pac = ProxyManager.generateProxyAutoconfigScript(packages, servers);
                return ProxyManager.setProxyAutoconfig(pac);
            }
        };

        /**
         * Restarts application flow. This means the app is already running and now getting started again.
         */

        Runtime.prototype.restart = function () {
            var globalStatus;
            if (typeof callback === "undefined") {
                callback = function () {
                }
            }

            globalStatus = Storage.get('proxmate_global_status');
            if (!globalStatus) {
                this.stop();
                return;
            }

            this.stop();

            return ServerManager.init((function (_this) {
                return function () {
                    PackageManager.init();
                    return _this.start();
                };
            })(this));
        };


        /**
         * Removed the proxy from chrome
         */

        Runtime.prototype.stop = function () {
            Browser.setIcon("ressources/images/icon48_grey.png");
            return ProxyManager.clearProxy();
        };

        return Runtime;

    })();

    exports.Runtime = new Runtime();

}).call(this);
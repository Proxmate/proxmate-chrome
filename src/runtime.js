(function () {
    var Browser, PackageManager, ProxyManager, Runtime, ServerManager, Storage, Config, Status, MessageManager;

    Runtime = (function () {
        function Runtime() {
        }

        Runtime.prototype.install = function (callback) {
            var server, uninstallUrl, has_run;

            has_run = Storage.get('has_run');

            if (has_run) {
                return;
            }

            server = Config.get('primary_server');
            uninstallUrl = "" + server + "remove/";

            Browser.setUninstallURL(uninstallUrl);
            Browser.createTab('pages/install/index.html')

            Storage.set('has_run', true);

            return callback();
        };

        Runtime.prototype.init = function () {
            var api_key, self = this;

            PackageManager = require('./package-manager').PackageManager;
            ServerManager = require('./server-manager').ServerManager;
            ProxyManager = require('./proxy-manager').ProxyManager;
            Storage = require('./storage').Storage;
            Browser = require('./browser').Browser;
            Config = require('./config').Config;
            Status = require('./status').Status;
            MessageManager = require('./message-manager').MessageManager;

            api_key = Storage.get('api_key');
            Storage.remove('proxmate_server_config');
            if (api_key) {
                Browser.setPopup("pages/popup/index.html");
            } else {
                Browser.iconOnClick(this.checkApi)
                self.install(function () {
                })
            }
        };

        Runtime.prototype.requestActivation = function (email, callback) {
            var server, requestActivationUrl;
            server = Config.get('primary_server');

            requestActivationUrl = "" + server + "api/user/activation/require/?api_v=" + Browser.getExtensionVersion();

            Browser.ajax.POST(
                requestActivationUrl,
                {
                    email: email,
                    browser: 'Chrome'
                },
                function (data) {
                    return callback(data);
                }
            );
        };

        Runtime.prototype.activatePlugin = function (key, callback) {
            var server, confirmActivationUrl, uninstallUrl, self;
            self = this;
            server = Config.get('primary_server');
            confirmActivationUrl = "" + server + "api/user/confirm/" + key + '/?api_v=' + Browser.getExtensionVersion();
            uninstallUrl = "" + server + "uninstall/" + key + '/';
            Browser.xhr(confirmActivationUrl, 'GET', function (data) {
                if (!data.success) {
                    return callback(data)
                }
                Storage.set('api_key', key);
                Status.update();
                Browser.setPopup("pages/popup/index.html");
                Browser.setUninstallURL(uninstallUrl);
                self.restart();
                return callback(data);
            });
        };

        /**
         * Check for api key
         */

        Runtime.prototype.checkApi = function () {
            var apiKey;
            apiKey = Storage.get('api_key');
            // if no api_key redirect to signup page
            if (!apiKey) {
                Browser.createTab('pages/install/index.html');
            }
        };


        /**
         * Starts the app. Retrieves servers and sets pac
         */

        Runtime.prototype.start = function () {
            var globalStatus, pac, packages, servers, api_key;
            api_key = Storage.get('api_key');
            globalStatus = Storage.get('proxmate_global_status');
            if (!globalStatus || !api_key) {
                this.stop();
                return;
            }

            Browser.generateButtons();
            Browser.setIcon("ressources/images/icon48.png", function () {});
            // get all packages
            packages = PackageManager.getInstalledPackages();
            // retrieve new messages
            MessageManager.get();
            // get all servers
            servers = ServerManager.getServers();
            // needs at least one package and one server for the service to work
            if (packages.length === 0 || servers.length === 0) {
                if (packages.length === 0) {
                    return;
                }
            } else {
                // generate PAC file with the retrieved servers and packages
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
                    _this.start();

                };
            })(this));
        };


        /**
         * Removed the proxy from chrome
         */

        Runtime.prototype.stop = function () {
            Browser.setIcon("ressources/images/icon48_grey.png", function () {});
            return ProxyManager.clearProxy();
        };

        return Runtime;

    })();

    exports.Runtime = new Runtime();

}).call(this);
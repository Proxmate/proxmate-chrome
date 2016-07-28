(function () {
    var App, Browser, Config, PrivacyManager, EventBinder, PackageManager, ProxyManager, Runtime, ServerManager, Storage, app, MessageManager, Status;

    Config = require('./config').Config;
    PackageManager = require('./package-manager').PackageManager;
    Storage = require('./storage').Storage;
    ProxyManager = require('./proxy-manager').ProxyManager;
    ServerManager = require('./server-manager').ServerManager;
    EventBinder = require('./event-binder').EventBinder;
    Runtime = require('./runtime').Runtime;
    Browser = require('./browser').Browser;
    Status = require('./status').Status;
    PrivacyManager = require('./privacy-manager').PrivacyManager;
    MessageManager = require('./message-manager').MessageManager;

    App = (function () {
        function App() {
        }

        /**
         * Initialise all the modules
         */

        App.prototype.init = function () {

            Browser.init();
            Config.init();
            return Storage.init(function () {
                return ServerManager.init(function () {
                    PackageManager.init();
                    ProxyManager.init();
                    EventBinder.init();
                    MessageManager.init();
                    Status.init();
                    Runtime.init();
                    PrivacyManager.init();
                    return Runtime.start();
                });
            });
        };

        return App;

    })();
    setTimeout(function () {
        app = new App();
        app.init();
    }, 500)

}).call(this);
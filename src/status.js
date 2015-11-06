(function () {
    var Storage, Status, Config, Browser, Runtime;

    Storage = require('./storage').Storage;

    Browser = require('./browser').Browser;

    Config = require('./config').Config;

    Runtime = require('./runtime').Runtime;

    Status = (function () {
        function Status() {

        }


        Status.prototype.init = function () {
            this.update(function () {

            });
        };

        Status.prototype.update = function (callback) {
            if (!callback) {
                callback = function () {
                }
            }
            var api_key, server, statusUrl;

            account_status = Storage.get('account_status')
            global_status = Storage.get('proxmate_global_status')

            api_key = Storage.get('api_key');

            if (!api_key) {
                return;
            }
            server = Config.get('primary_server');
            statusUrl = "" + server + "api/status/" + api_key + "/";

            Browser.xhr(
                statusUrl,
                'GET',
                function (success) {
                    var time_remaining = new Date().getTime() - new Date(success.data.plan_expiration_date * 1000).getTime();
                    var diffDays = Math.round(time_remaining / 86400000); // days
                    var diffHrs = Math.round((time_remaining % 86400000) / 3600000); // hours
                    var diffMins = Math.round(((time_remaining % 86400000) % 3600000) / 60000); // minutes

                    if (new Date() > new Date(success.data.plan_expiration_date * 1000)) {
                        Storage.set('proxmate_global_status', false);
                        Storage.set('account_status', 'account_expired');
                        success.data.subscription_status = 'subscription_expired';
                        Runtime = require('./runtime').Runtime;
                        Runtime.stop();
                    }
                    else if (account_status == 'account_expired' && !global_status) {
                        Storage.set('proxmate_global_status', true);
                        Storage.set('account_status', 'account_active');

                        Runtime = require('./runtime').Runtime;
                        Runtime.start();
                    }

                    Storage.set('subscription_status', success);
                    callback(success);
                },
                function (error) {
                }
            )
        };

        return Status;

    })();

    exports.Status = new Status();

}).call(this);
(function () {
    var Config, Browser, Runtime, Storage, Status;

    Status = (function () {
        function Status() {

        }

        Status.prototype.init = function () {
            var status_check;
            Storage = require('./storage').Storage;
            Browser = require('./browser').Browser;
            Config = require('./config').Config;
            Runtime = require('./runtime').Runtime;
            status_check = Storage.get('status_check');

            if(!status_check) {
                status_check = {};
            }

            Storage.set('status_check', status_check);
            this.update(function () {});
        };

        Status.prototype.get = function () {
            return Storage.get('subscription_status');
        };

        Status.prototype.getSubscriptionStatus = function () {
            var subscription_status;
            subscription_status = Storage.get('subscription_status')

            if(!subscription_status) {
                return false
            }

            return subscription_status.data.subscription_status
        };

        Status.prototype.dailyChannelCheck = function () {
            var api_key, status_check, _today, checkUrl, server;

            api_key = Storage.get('api_key');

            if(! api_key ) {
                return
            }

            server = Config.get('primary_server');
            checkUrl = "" + server + "api/status/" + api_key + "/";
            status_check = Storage.get('status_check');

            _today = this.getDateString(new Date().getTime());

            if( _today == status_check.channel_check ) {
                return;
            }

            return Browser.ajax.POST(checkUrl, {check: "channel", day_check: _today}, function (response) {
                if( !response.success )
                {
                    return
                }

                status_check.channel_check = _today;
                Storage.set('status_check', status_check);
            })
        };

        Status.prototype.dailyActiveCheck = function () {
            var api_key, status_check, _today, checkUrl, server;

            api_key = Storage.get('api_key');

            if(! api_key ) {
                return
            }

            server = Config.get('primary_server');
            checkUrl = "" + server + "api/status/" + api_key + "/";

            status_check = Storage.get('status_check');

            _today = this.getDateString(new Date().getTime());
            if( _today == status_check.active_check ) {
                return;
            }

            return Browser.ajax.POST(checkUrl, {check: "daily", day_check: _today}, function (response) {
                if( !response.success )
                {
                    return
                }

                status_check.active_check = _today;
                Storage.set('status_check', status_check);
            })
        };

        Status.prototype.getDaysLeft = function () {
            var account_status, difference, cd, ch, days, hours;
            account_status = Storage.get('subscription_status')
            difference = account_status.data.plan_expiration_date * 1000 - new Date().getTime()
            cd = 24 * 60 * 60 * 1000;
            ch = 60 * 60 * 1000;
            days = Math.floor(difference / cd);
            hours = Math.floor((difference - days * cd) / ch);

            if (hours) {
                days++;
            }
            return days;
        };

        Status.prototype.getDateString = function(expiry_timestamp) {
            var _future_time = new Date(expiry_timestamp);
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            var month = _future_time.getUTCMonth();
            var day = _future_time.getUTCDate();
            var year = _future_time.getUTCFullYear();

            return day + "/" + monthNames[month] + "/" + year;
        };

        Status.prototype.update = function (callback) {
            var global_status, account_status;
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

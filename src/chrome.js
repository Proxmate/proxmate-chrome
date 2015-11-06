(function () {
    var Chrome;

    Chrome = (function () {
        function Chrome() {
        }

        Chrome.prototype.init = function () {
        };

        Chrome.prototype.tabs = {
            create: function () {
            }
        };

        Chrome.prototype.storage = {
            local: {
                set: function (object) {
                },
                get: function () {
                },
                remove: function () {
                }
            }
        };

        Chrome.prototype.proxy = {
            settings: {
                set: function () {
                },
                clear: function () {
                }
            }
        };

        Chrome.prototype.runtime = {
            onMessage: {
                addListener: function () {
                }
            }
        };

        Chrome.prototype.browserAction = {
            setBadgeText: function () {

            },
            setIcon: function () {
            },
            setPopup: function () {
            }
        };

        return Chrome;

    })();

    if ((typeof chrome !== "undefined" && chrome !== null) && (chrome.app != null)) {
        exports.Chrome = chrome;
    } else {
        exports.Chrome = new Chrome();
    }

}).call(this);
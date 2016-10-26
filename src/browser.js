(function () {
    var $, Browser, Chrome, PackageManager;

    Chrome = require('./chrome').Chrome;
    PackageManager = require('./package-manager').PackageManager;

    $ = require('../bower_components/jquery/dist/jquery.js');

    Browser = (function () {
        function Browser() {
            this.tabUpdateListener = function (id, info, tabObject) {
                PackageManager.checker(id, info, tabObject)
            };
        }

        Browser.prototype.init = function () {
            PackageManager = require('./package-manager').PackageManager;
        };

        /**
         * Opens url in a new tab
         * @param {String} url the url to open
         */

        Browser.prototype.createTab = function (url) {
            return Chrome.tabs.create({
                url: url
            });
        };

        Browser.prototype.getActiveTab = function (callback) {
            Chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                callback(tabs[0])
            });
        };

        Browser.prototype.queryTabs = function (query, callback) {
            Chrome.tabs.query({
                url: "*://*" + query + "*"
            }, function(tabs) {
                callback(tabs)
            })
        };

        Browser.prototype.onTabUpdate = function () {
            if (!Chrome.tabs.onUpdated.hasListener(this.tabUpdateListener)) {
                Chrome.tabs.onUpdated.addListener(this.tabUpdateListener);
            }
        };

        /**
         * Updates the current tab
         * @param {String} url the url to open
         */

        Browser.prototype.updateTab = function (tab, url) {
            Chrome.tabs.update(tab.id, {url: url});
        };

        /**
         * Sets browser wide proxy to autoconfig
         * @param {String}   pacScript the autoconfig string
         * @param {Function} callback  callback to execute after
         */

        Browser.prototype.setProxyAutoconfig = function (pacScript, callback) {
            var config;
            config = {
                mode: "pac_script",
                pacScript: {
                    data: pacScript
                }
            };
            return Chrome.proxy.settings.set({
                value: config,
                scope: 'regular'
            }, callback);
        };


        /**
         * Removes all custom proxies and resets to system
         * @param  {Function} callback callback
         */

        Browser.prototype.clearProxy = function (callback) {
            return Chrome.proxy.settings.clear({}, callback);
        };

        /**
         * Sets the browser icon
         * @param {string} iconUrl the url for the icon
         */

        Browser.prototype.setIcon = function (iconUrl, callback) {
            return Chrome.browserAction.setIcon({
                path: iconUrl,
            }, function(){
                callback()
            });
        };


        /**
         * Sets the text for the icon
         * @param {string} text the text to set
         */

        Browser.prototype.setIcontext = function (text) {
            return Chrome.browserAction.setBadgeText({
                text: text
            });
        };

        /**
         * Gets the text for the icon
         */

        Browser.prototype.getIcontext = function (callback) {
            Chrome.browserAction.getBadgeText({}, function (value) {
                callback(value)
            })
        };

        /**
         * Sets the popup url
         * @param {string} popupUrl the url for the icon
         */

        Browser.prototype.setPopup = function (popupUrl) {
            return Chrome.browserAction.setPopup({
                popup: popupUrl
            });
        };

        /**
         * Removes a key from the browser storage
         * @param  {string} key the key to remove
         */

        Browser.prototype.removeFromStorage = function (key) {
            return Chrome.storage.local.remove(key);
        };


        /**
         * Writes a object into browser storage
         * @param  {Object} object the object (key, value) to write
         */

        Browser.prototype.writeIntoStorage = function (object) {
            return Chrome.storage.local.set(object);
        };


        /**
         * Returns a element from storage
         * @param  {string}   key      the elements key
         * @param  {Function} callback callback
         */

        Browser.prototype.retrieveFromStorage = function (key, callback) {
            return Chrome.storage.local.get(key, callback);
        };


        /**
         * Sets the uninstall url
         * @param  {string} url url of the page where user should be send
         * @param  {Function} callback callback not yet implemented
         */

        Browser.prototype.setUninstallURL = function (url) {
            return Chrome.runtime.setUninstallURL(url);
        };

        /**
         * Add a event listener for the message event
         * @param  {function} listener listener function
         */

        Browser.prototype.addEventListener = function (listener) {
            Chrome.runtime.onMessageExternal.addListener(listener);
            return Chrome.runtime.onMessage.addListener(listener);
        };

        /**
         * Performs a GET xmlhttprequest
         * @param  {string} url             the url to request
         * @param  {string} type            POST or GET
         * @param  {Function} successCallback callback
         * @param  {Function} errorCallback   callback
         */

        Browser.prototype.xhr = function (url, type, successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function () {
                };
            }
            if (errorCallback == null) {
                errorCallback = function () {
                };
            }
            return $.ajax(url, {
                type: type,
                success: successCallback,
                error: errorCallback
            });
        };

        Browser.prototype.ajax = {};


        /**
         * Performs a GET xmlhttprequest
         * @param  {string} url             the url to request
         * @param  {Function} successCallback callback
         * @param  {Function} errorCallback   callback
         */

        Browser.prototype.ajax.GET = function (url, successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function () {
                };
            }
            if (errorCallback == null) {
                errorCallback = function () {
                };
            }
            return $.ajax(url, {
                success: successCallback,
                error: errorCallback
            });
        };

        /**
         * Performs a PUT xmlhttprequest
         * @param  {string} url             the url to request
         * @param  {object} data            data to be sent to server
         * @param  {Function} successCallback callback
         * @param  {Function} errorCallback   callback
         */

        Browser.prototype.ajax.PUT = function (url, data, successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function () {
                };
            }
            if (errorCallback == null) {
                errorCallback = function () {
                };
            }
            return $.ajax(url, {
                type: 'PUT',
                data: data,
                success: successCallback,
                error: errorCallback
            });
        };


        /**
         * Performs a POST xmlhttprequest
         * @param  {string} url             the url to request
         * @param  {object} data            data to be sent to server
         * @param  {Function} successCallback callback
         * @param  {Function} errorCallback   callback
         */

        Browser.prototype.ajax.POST = function (url, data, successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function () {
                };
            }
            if (errorCallback == null) {
                errorCallback = function () {
                };
            }
            return $.ajax(url, {
                type: 'POST',
                data: data,
                success: successCallback,
                error: errorCallback
            });
        };


        /**
         * wrapper for setTimeout function
         * @param {Function} callback [description]
         * @param {int}   ms       number
         */

        Browser.prototype.setTimeout = function (callback, ms) {
            Chrome.proxmate.setTimeout(callback, ms)
        };

        /**
         * Wrapper for clearInterval function
         * @param  {Object} timeoutId timeout
         */

        Browser.prototype.clearTimeout = function (timeoutId) {
            Chrome.proxmate.clearTimeout(timeoutId)
        };

        Browser.prototype.setInterval = function (interval_function, time) {
            console.log(Chrome.proxmate)
            Chrome.proxmate.setInterval(interval_function, time)
        };

        /**
         * Generates the button and the popup window
         */

        Browser.prototype.generateButtons = function () {
            Chrome.proxmate.generateButttons(Chrome.browserAction.onClicked.listener);
        };

        /**
         * This is run when Proxmate is uninstalled
         */

        Browser.prototype.uninstallScript = function () {

        };

        /**
         * Clears the browser storage
         */

        Browser.prototype.clearStorage = function () {};

        /**
         * Get extension version
         */

        Browser.prototype.getExtensionVersion = function () {
            return Chrome.runtime.getManifest().version
        };

        Browser.prototype.iconOnClick = function (listener) {
            Chrome.browserAction.onClicked.addListener(listener);
        };

        return Browser;

    })();

    exports.Browser = new Browser();

}).call(this);
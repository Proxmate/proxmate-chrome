(function () {
    var $, Browser, Chrome;

    Chrome = require('./chrome').Chrome;

    $ = require('../bower_components/jquery/dist/jquery.js');

    Browser = (function () {
        function Browser() {
        }

        Browser.prototype.init = function () {
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

        Browser.prototype.setIcon = function (iconUrl) {
            return Chrome.browserAction.setIcon({
                path: iconUrl
            });
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
         * Sets the text for the icon (if possible)
         * @param {string} text the text to set
         */

        Browser.prototype.setIcontext = function (text) {
            return Chrome.browserAction.setBadgeText({
                text: text
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
         * Set the uninstall URL
         * @param  {function} listener listener function
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
         * Performs a xmlhttprequest
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

        return Browser;

    })();

    exports.Browser = new Browser();

}).call(this);
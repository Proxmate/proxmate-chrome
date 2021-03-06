(function () {
    'use strict';
    var ProxMate;

    ProxMate = (function () {
        function ProxMate() {
        }

        ProxMate.prototype.emitMessage = function (messageId, parameter, callback) {
            return chrome.runtime.sendMessage({
                action: messageId,
                params: parameter
            }, callback);
        };

        ProxMate.prototype.installPackage = function (packageId, callback) {
            return this.emitMessage('installPackage', {
                packageId: packageId
            }, callback);
        };

        ProxMate.prototype.getProxmateStatus = function (callback) {
            return this.emitMessage('getProxmateGlobalStatus', {}, callback);
        };

        ProxMate.prototype.setProxmateStatus = function (status, callback) {
            return this.emitMessage('setProxmateGlobalStatus', {
                newStatus: status
            }, callback);
        };

        ProxMate.prototype.dailyActiveCheck = function (callback) {
            return this.emitMessage("dailyActiveCheck", {}, callback)
        };

        ProxMate.prototype.removeRule = function (packageId, rule, callback) {
            return this.emitMessage("removeRule", {
                packageId: packageId,
                rule: rule
            }, callback)
        };

        ProxMate.prototype.addRule = function (packageId, rule, callback) {
            return this.emitMessage("addRule", {
                packageId: packageId,
                rule: rule
            }, callback)
        };

        ProxMate.prototype.dailyChannelCheck = function (callback) {
            return this.emitMessage("dailyChannelCheck", {}, callback)
        };

        ProxMate.prototype.getInstalledPackages = function (callback) {
            return this.emitMessage('getInstalledPackages', {}, callback);
        };

        ProxMate.prototype.removePackage = function (packageId, callback) {
            return this.emitMessage('removePackage', {
                packageId: packageId
            }, callback);
        };

        ProxMate.prototype.getDonationkey = function (callback) {
            return this.emitMessage('getDonationkey', {}, callback);
        };

        ProxMate.prototype.setDonationkey = function (key, callback) {
            return this.emitMessage('setDonationkey', {
                donationKey: key
            }, callback);
        };

        return ProxMate;

    })();

    window.ProxMate = new ProxMate();

}).call(this);

(function() {
  'use strict';
  var ProxMate;

  ProxMate = (function() {
    function ProxMate() {}

    ProxMate.prototype.emitMessage = function(messageId, parameter, callback) {
      return chrome.runtime.sendMessage({
        action: messageId,
        params: parameter
      }, callback);
    };

    ProxMate.prototype.installPackage = function(packageId, callback) {
      return this.emitMessage('installPackage', {
        packageId: packageId
      }, callback);
    };

    ProxMate.prototype.getProxmateStatus = function(callback) {
      return this.emitMessage('getProxmateGlobalStatus', {}, callback);
    };

    ProxMate.prototype.setProxmateStatus = function(status, callback) {
      return this.emitMessage('setProxmateGlobalStatus', {
        newStatus: status
      }, callback);
    };

    ProxMate.prototype.getInstalledPackages = function(callback) {
      return this.emitMessage('getInstalledPackages', {}, callback);
    };

    ProxMate.prototype.removePackage = function(packageId, callback) {
      return this.emitMessage('removePackage', {
        packageId: packageId
      }, callback);
    };

    ProxMate.prototype.getDonationkey = function(callback) {
      return this.emitMessage('getDonationkey', {}, callback);
    };

    ProxMate.prototype.setDonationkey = function(key, callback) {
      return this.emitMessage('setDonationkey', {
        donationKey: key
      }, callback);
    };

    return ProxMate;

  })();

  window.ProxMate = new ProxMate();

}).call(this);

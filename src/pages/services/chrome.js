(function () {
  'use strict';
  angular.module('chrome', []).factory('Chrome', function () {
    var emitMessage;
    emitMessage = function (messageId, parameter, callback) {
      return chrome.runtime.sendMessage({
        action: messageId,
        params: parameter
      }, callback);
    };
    return {
      installPackage: function (packageId, callback) {
        return emitMessage('installPackage', { packageId: packageId }, callback);
      },
      getProxmateStatus: function (callback) {
        return emitMessage('getProxmateGlobalStatus', {}, callback);
      },
      removeRule: function (callback) {
        return emitMessage('removeRule', {}, callback);
      },
      setProxmateStatus: function (status, callback) {
        return emitMessage('setProxmateGlobalStatus', { newStatus: status }, callback);
      },
      setPrivacyStatus: function (status, callback) {
        return emitMessage('setPrivacyStatus', { newStatus: status }, callback);
      },
      setMalwareStatus: function (status, callback) {
        return emitMessage('setMalwareStatus', { newStatus: status }, callback);
      },
      setAntiPhishingStatus: function (status, callback) {
        return emitMessage('setAntiPhishingStatus', { newStatus: status }, callback);
      },
      setAdBlockingStatus: function (status, callback) {
        return emitMessage('setAdBlockingStatus', { newStatus: status }, callback);
      },
      getPrivacyStatus: function (callback) {
        return emitMessage('getPrivacyStatus', {}, callback);
      },
      getMalwareStatus: function (callback) {
        return emitMessage('getMalwareStatus', {}, callback);
      },
      getAntiPhishingStatus: function (callback) {
        return emitMessage('getAntiPhishingStatus', {}, callback);
      },
      getAbBlockingStatus: function (callback) {
        return emitMessage('getAdBlockingStatus', {}, callback);
      },
      getInstalledPackages: function (callback) {
        return emitMessage('getInstalledPackages', {}, callback);
      },
      removePackage: function (packageId, callback) {
        return emitMessage('removePackage', { packageId: packageId }, callback);
      },
      getDonationkey: function (callback) {
        return emitMessage('getDonationkey', {}, callback);
      },
      setDonationkey: function (key, callback) {
        return emitMessage('setDonationkey', { donationKey: key }, callback);
      },
      requestActivation: function (email, callback) {
        return emitMessage('requestActivation', { email: email }, callback);
      },
      checkForUpdates: function (email, callback) {
        return emitMessage('checkForUpdates', { email: email }, callback);
      },
      getNetflixCountries: function (callback) {
        return emitMessage('getNetflixCountries', {}, callback);
      },
      selectNetflixCountry: function (country, callback) {
        return emitMessage('selectNetflixCountry', { country: country }, callback);
      },
      updateStatus: function (callback) {
        return emitMessage('updateStatus', {}, callback);
      },
      getStatus: function (callback) {
        return emitMessage('getStatus', {}, callback);
      },
      showMessages: function (callback) {
        return emitMessage('showMessages', {}, callback);
      },
      closeMessage: function (id, callback) {
        return emitMessage('closeMessage', { id: id }, callback);
      }
    };
  });
}.call(this));
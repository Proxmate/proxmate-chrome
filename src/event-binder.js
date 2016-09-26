(function () {
    var PrivacyManager, MessageManager, Browser, ServerManager, EventBinder, PackageManager, Runtime, Storage, Status;

    Browser = require('./browser').Browser;

    PackageManager = require('./package-manager').PackageManager;

    ServerManager = require('./server-manager').ServerManager;

    Storage = require('./storage').Storage;

    PrivacyManager = require('./privacy-manager').PrivacyManager;

    Runtime = require('./runtime').Runtime;

    Status = require('./status').Status;

    MessageManager = require('./message-manager').MessageManager;

    EventBinder = (function () {
                function EventBinder() {
                }

                EventBinder.prototype.init = function () {
                    return Browser.addEventListener(this.messageListener);
                };

                /**
                 * Event listener for chrome message events
                 * @param  {Object} request      request and parameters
                 * @param  {Object} sender       sender object
                 * @param  {Function} sendResponse callback to emit answer back to frontend
                 * @return {boolean}              status whether to keep the connection open or not
                 */

                EventBinder.prototype.messageListener = function (request, sender, sendResponse) {
                    var key, newStatus, packageId, packages, params, status, global_status;
                    params = request.params;
                    switch (request.action) {
                        case 'activatePlugin':
                            Runtime.activatePlugin(params.activation_code, function (response) {
                                return sendResponse(response);
                            });
                            break;
                        case 'togglePrivacyAlerts':
                            status = Storage.get('proxmate-domain-debugger');
                            Storage.set('proxmate-domain-debugger', !status);
                            sendResponse(!status)
                            break;
                        case 'checkInstall':
                            sendResponse(true)
                            break;
                        case 'installPackage':
                            PackageManager.installPackage(params.packageId, function (response) {
                                return sendResponse(response);
                            });
                            break;
                        case 'getMalwareStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                status = Storage.get('proxmate_malware_status');
                                if (status !== undefined) {
                                    sendResponse(status);
                                } else {
                                    status = Storage.set('proxmate_malware_status', true);
                                    sendResponse(true);
                                }
                            }
                            break;
                        case 'setMalwareStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                newStatus = params.newStatus;
                                if (typeof newStatus !== 'boolean') {
                                    newStatus = false;
                                }
                                Storage.set('proxmate_malware_status', newStatus);
                                sendResponse(true);
                            }
                            break;
                        case 'getAdBlockingStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                status = Storage.get('proxmate_ad_blocking_status');
                                if (status !== undefined) {
                                    sendResponse(status);
                                } else {
                                    status = Storage.set('proxmate_ad_blocking_status', true);
                                    sendResponse(false);
                                }
                            }
                            break;
                        case 'setAdBlockingStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                newStatus = params.newStatus;
                                if (typeof newStatus !== 'boolean') {
                                    newStatus = false;
                                }
                                Storage.set('proxmate_ad_blocking_status', newStatus);
                                sendResponse(true);
                            }
                            break;
                        case 'getPrivacyStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                status = Storage.get('proxmate_privacy_status');
                                if (status !== undefined) {
                                    sendResponse(status);
                                } else {
                                    status = Storage.set('proxmate_privacy_status', true);
                                    sendResponse(true);
                                }
                            }
                            break;
                        case 'setPrivacyStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                newStatus = params.newStatus;
                                if (typeof newStatus !== 'boolean') {
                                    newStatus = false;
                                }
                                Storage.set('proxmate_privacy_status', newStatus);
                                sendResponse(true);
                            }
                            break;
                        case 'getAntiPhishingStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                status = Storage.get('proxmate_phishing_status');
                                if (status !== undefined) {
                                    sendResponse(status);
                                } else {
                                    status = Storage.set('proxmate_phishing_status', true);
                                    sendResponse(true);
                                }
                            }
                            break;
                        case 'setAntiPhishingStatus':
                            global_status = Storage.get('proxmate_global_status');
                            if (!global_status) {
                                sendResponse(false);

                            } else {
                                newStatus = params.newStatus;
                                if (typeof newStatus !== 'boolean') {
                                    newStatus = false;
                                }
                                Storage.set('proxmate_phishing_status', newStatus);
                                sendResponse(true);
                            }
                            break;
                        case 'getProxmateGlobalStatus':
                            status = Storage.get('proxmate_global_status');
                            if (status) {
                                sendResponse(status);
                            } else {
                                sendResponse(false);
                            }
                            break;
                        case 'setProxmateGlobalStatus':
                            newStatus = params.newStatus;
                            if (typeof newStatus !== 'boolean') {
                                newStatus = false;
                            }
                            Storage.set('proxmate_global_status', newStatus);
                            if (newStatus) {
                                Runtime.start();
                            } else {
                                Runtime.stop();
                            }
                            sendResponse(true);
                            break;
                        case 'getInstalledPackages':
                            packages = PackageManager.getInstalledPackages();
                            sendResponse(packages);
                            break;
                        case 'removePackage':
                            packageId = params.packageId;
                            PackageManager.removePackage(packageId);
                            sendResponse(true);
                            break;
                        case 'getApiKey':
                            key = Storage.get('api_key');
                            sendResponse(key);
                            break;
                        case 'dailyChannelCheck':
                            Status.dailyChannelCheck();
                            break;
                        case 'dailyActiveCheck':
                            Status.dailyActiveCheck();
                            break;
                        case 'updateStatus':
                            Status.update(function (response) {
                                response.api_key = Storage.get('api_key');
                                return sendResponse(response);
                            });
                            break;
                        case 'requestActivation':
                            Runtime.requestActivation(params.email, function (response) {
                                return sendResponse(response);
                            });
                            break;
                        case 'getNetflixCountries':
                            return sendResponse(PackageManager.getNetflixCountries());
                            break;
                        case 'selectNetflixCountry':
                            return sendResponse(PackageManager.selectNetflixCountry(params.country));
                            break;
                        case 'selectNetflix':
                            PackageManager.selectNetflixCountry({short_hand: params.country})
                            return sendResponse(true);
                            break;
                        case 'showMessages':
                            var msg = MessageManager.show();
                            sendResponse(msg);
                            break;
                        case 'closeMessage':
                            var msg = MessageManager.closeMessage(params.id);
                            sendResponse(msg);
                            break;
                        case 'getStatus':
                            status = Storage.get('subscription_status');
                            sendResponse(status);
                            break;
                        case 'checkForUpdates':
                            ServerManager.fetchServerList(function () {
                                PackageManager.checkForUpdates();
                            });
                            sendResponse(true);
                        case 'addRule':
                            PackageManager.addRule(params.packageId, params.rule, function () {

                            });
                            sendResponse(true);
                    }
                    return true;
                };

                return EventBinder;

            })();

    exports.EventBinder = new EventBinder();

}).call(this);
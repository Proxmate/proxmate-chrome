(function () {
    var Browser, Config, PackageManager, Storage;

    PackageManager = (function () {
        function PackageManager() {
        }

        PackageManager.prototype.checker = function (id, info, tabObject) {
            var _self = this;
            var _rules_array = Storage.get("rulesArray")
            if (info.status == "complete") {
                // check if any netflix tab opened
                Browser.queryTabs(
                    ".netflix.com/watch",
                    function (_tabs) {
                        if (!_tabs.length || !_rules_array) {
                            // NO OPENED TAB
                            _self.removeRule(80, ['.ix.nflxvideo.net', '.isp.nflxvideo.net', 'www.netflix.com'], function () {
                                Storage.set("rulesArray", []);
                            })
                        } else {
                            //STILL TABS OPENED
                        }
                    });

                if (tabObject.url.indexOf('netflix.com') == -1) {
                    // THIS TAB IS NOT GOOD
                    return;
                }

                _self.send_tick(80);
                // GET ID
                var _url = tabObject.url.split('?')[0];
                var _showId = _url.substr(_url.lastIndexOf('/') + 1);

                for (var i = 0; i < _rules_array.length; i++) {
                    // Id not in rules
                    if (_url.indexOf(_showId) != -1) {
                        continue;
                    }

                    // there are more rules, so remove just this one
                    if (_rules_array.length > 1) {
                        _rules_array.splice(i, 1)
                        Storage.set("rulesArray", _rules_array);
                        i--;
                    } else {
                        // no more id rules == remove all rules
                        _self.removeRule(80, ['.ix.nflxvideo.net', '.isp.nflxvideo.net', 'www.netflix.com'], function () {
                            Storage.set("rulesArray", []);
                        })
                    }
                }
            }

        };

        PackageManager.prototype.checker_listener = function () {
        };

        PackageManager.prototype.init = function () {
            var _self = this;
            Storage = require('./storage').Storage;
            Config = require('./config').Config;
            Browser = require('./browser').Browser;
            Runtime = require('./runtime').Runtime;

            // add listener for rules
            Browser.onTabUpdate(this.checker);

            return this.checkForUpdates();
        };

        /**
         * Downloads a list containing of ID and version
         * @param  {Function} callback callback to pass json on
         */

        PackageManager.prototype.downloadVersionRepository = function (callback) {
            var api_key, server, updateUrl;
            api_key = Storage.get('api_key');
            server = Config.get('primary_server');
            updateUrl = "" + server + "api/package/update/" + api_key + "/";
            if (!api_key) {
                return callback()
            }

            return Browser.xhr(
                updateUrl,
                'GET',
                function (data) {
                    return callback(data);
                });
        };

        PackageManager.prototype.send_tick = function (channel_id) {
            var api_key, server, tickURL;
            api_key = Storage.get('api_key');
            server = Config.get('primary_server');
            tickURL = "" + server + "api/package/tick/" + api_key + "/";
            if (!api_key) {
                return callback()
            }

            return Browser.ajax.POST(tickURL, {channel: channel_id}, function (packages) {
            });
        };

        /**
         * Queries the primary server and checks for updates
         */

        PackageManager.prototype.checkForUpdates = function () {
            return this.downloadVersionRepository((function (_this) {
                return function (versionRepository) {
                    var installedPackages, key, _requireRestart, _results;
                    installedPackages = Storage.get('proxmate_installed_packages');

                    _results = [];
                    for (key in installedPackages) {
                        if (versionRepository && !(key in versionRepository)) {
                            _requireRestart = true;
                            _this.removePackage(key)
                        }
                    }

                    for (key in versionRepository) {
                        if (installedPackages && key in installedPackages && parseFloat(versionRepository[key].version) == parseFloat(installedPackages[key])) {
                            continue;
                        }

                        _results.push(key)
                    }

                    if (!_results.length) {
                        if (_requireRestart) {
                            Runtime.restart();
                        }
                        return _results
                    }

                    _this.installProxmate(_results, function () {
                        Runtime.restart();
                        return _results;
                    });

                    return _results;
                };
            })(this));
        };

        /**
         * Installs / overrides package for key 'key'
         * @param  {String} key package identifier
         * @param {Function} callback callback function
         */

        PackageManager.prototype.installProxmate = function (packages, callback) {
            var api_key, packageUrl, server, _self = this;
            callback = callback || function () {
                };
            server = Config.get('primary_server');
            api_key = Storage.get('api_key');
            packageUrl = "" + server + "api/packages/install/" + api_key + "/";

            if (!api_key) {
                return callback({
                    success: false,
                    message: "plugin inactive"
                });
            }
            return Browser.ajax.POST(packageUrl, {packages: JSON.stringify(packages)}, function (packages) {
                var installedPackages;
                installedPackages = Storage.get('proxmate_installed_packages');
                if (!installedPackages) {
                    installedPackages = {};
                }

                for (var i = 0; i < packages.length; i++) {
                    _self.storePackage(packages[i])
                }

                callback()
            })
        };

        /**
         * Stores / overrides package for key 'key'
         * @param  {Object}  package data
         * @param {Function} callback callback function
         */

        PackageManager.prototype.storePackage = function (packageData, callback) {
            var installedPackages;
            installedPackages = Storage.get('proxmate_installed_packages');
            if (!installedPackages) {
                installedPackages = {};
            }

            if (packageData.additional_countries.length && packageData.name == 'Netflix') {
                netflix_countries = Storage.get('netflix_countries');

                if (!netflix_countries || !netflix_countries.selected) {
                    netflix_countries = {
                        'selected': packageData.country,
                        'id': packageData.id
                    }
                }

                packageData.country = netflix_countries.selected;

                Storage.set('netflix_countries', netflix_countries)
            }

            installedPackages[packageData.id] = packageData['version'];
            Storage.set(packageData.id, packageData);
            Storage.set('proxmate_installed_packages', installedPackages);

            return;
        };

        /**
         * Removes an array of rules from a package
         * @param  {Object}  package_id - id of the package
         * @param  {Object}  rules_array - array of string rules to be removed
         * @param {Function} callback callback function
         */

        PackageManager.prototype.removeRule = function (package_id, rules_array, callback) {
            var installedPackages, changed_package, _found = false;
            installedPackages = Storage.get('proxmate_installed_packages');
            if (!installedPackages) {
                installedPackages = {};
            }

            if (installedPackages[package_id]) {
                changed_package = Storage.get(package_id);
                var rules = changed_package.routing;
                for (var i = 0; i < changed_package.routing.length; i++) {
                    var _rule = changed_package.routing[i].contains[0];
                    if (!_rule) {
                        continue;
                    }
                    for (var j = 0; j < rules_array.length; j++) {
                        if (_rule == rules_array[j]) {
                            changed_package.routing.splice(i, 1);
                            i--;
                            _found = true;
                        }
                    }
                }
            }

            if (!_found) {
                return callback()
            }

            Storage.set(package_id, changed_package);


            Runtime.restart();
            return callback()
        };

        /**
         * Adds an array of rules to a package
         * @param  {Object}  package_id - id of the package
         * @param  {Object}  rules_array - array of string rules to be removed
         * @param {Function} callback callback function
         */

        PackageManager.prototype.addRule = function (package_id, rules_array, callback) {
            var installedPackages, changed_package, _rules_array, _notFound = false;
            installedPackages = Storage.get('proxmate_installed_packages');
            if (!installedPackages) {
                installedPackages = {};
            }

            _rules_array = Storage.get("rulesArray");

            if (!_rules_array) {
                _rules_array = [];
            }
            if (installedPackages[package_id]) {
                changed_package = Storage.get(package_id);
                for (var i = 0; i < rules_array.length; i++) {
                    changed_package.routing.push({
                        contains: [rules_array[i]],
                        host: "",
                        startsWith: ""
                    });
                }
            } else {
                return callback()
            }
            Browser.getActiveTab(
                function (tab) {
                    if (tab) {
                        if (tab.url.indexOf('netflix.com') == -1) {
                            return;
                        }

                        var _url = tab.url.split('?')[0];

                        var _found = false;

                        for (var i = 0; i < _rules_array.length; i++) {
                            if (_rules_array[i].showId == _url.substr(_url.lastIndexOf('/') + 1)) {
                                _found = true;
                            }
                        }

                        if (!_found && _url.substr(_url.lastIndexOf('/') + 1) != 0) {
                            _rules_array.push({
                                tabId: tab.id,
                                showId: _url.substr(_url.lastIndexOf('/') + 1)
                            });
                            Storage.set("rulesArray", _rules_array)
                            if (tab.url.indexOf('netflix.com') > -1) {
                                // NO TAB
                            }
                        }
                    }
                }
            );
            Storage.set(package_id, changed_package);

            Runtime.restart();
            callback()
        };

        /**
         * Installs / overrides package for key 'key'
         * @param  {String} key package identifier
         * @param {Function} callback callback function
         */

        PackageManager.prototype.installPackage = function (key, callback) {
            var api_key, packageUrl, server;
            callback = callback || function () {
                };
            server = Config.get('primary_server');
            api_key = Storage.get('api_key');
            packageUrl = "" + server + "api/package/install/" + key + "/" + api_key + "/";

            if (!api_key) {
                return callback({
                    success: false,
                    message: "plugin_inactive"
                });
            }
            return Browser.xhr(packageUrl, 'GET', function (packageData) {
                var installedPackages;
                //installedPackages = Storage.set('proxmate_installed_packages',"");
                installedPackages = Storage.get('proxmate_installed_packages');
                if (!installedPackages) {
                    installedPackages = {};
                }


                if (packageData.additional_countries.length && packageData.name == 'Netflix') {
                    netflix_countries = Storage.get('netflix_countries');
                    if (!netflix_countries || !netflix_countries.selected) {
                        netflix_countries = {
                            'selected': packageData.country
                        }
                    }

                    packageData.country = netflix_countries.selected;

                    netflix_countries.package = packageData;
                    Storage.set('netflix_countries', netflix_countries)
                }

                installedPackages[key] = packageData['version'];
                Storage.set(key, packageData);
                Storage.set('proxmate_installed_packages', installedPackages);

                return callback({
                    success: true,
                    package: key
                });
            }, function (xhr) {
                switch (xhr.status) {
                    case 401:
                        callback({
                            success: false,
                            message: xhr.responseJSON.message
                        });
                        break;
                    case 404:
                        callback({
                            success: false,
                            message: "The package you tried to install doesn't exist..."
                        });
                        break;
                    default:
                        return callback({
                            success: false,
                            message: 'There was a problem installing this package.'
                        });
                }
            });
        };

        /**
         * Returns all installed packages with their package contents
         * @return {Object} packages
         */

        PackageManager.prototype.getInstalledPackages = function () {
            var id, installedPackages, packageJson, version;
            installedPackages = Storage.get('proxmate_installed_packages');
            packageJson = [];
            for (id in installedPackages) {
                version = installedPackages[id];
                packageJson.push(Storage.get(id));
            }
            return packageJson;
        };

        /**
         * Removes a installed package
         * @param  {String} key package id
         */

        PackageManager.prototype.removePackage = function (key) {
            var Runtime, installedPackages;
            Storage.remove(key);
            installedPackages = Storage.get('proxmate_installed_packages');
            if (!installedPackages) {
                installedPackages = {}
            }
            delete installedPackages[key];
            Storage.set('proxmate_installed_packages', installedPackages);
            Runtime.restart();
        };

        /**
         * Returns netflix extra countries
         */

        PackageManager.prototype.getNetflixCountries = function () {
            var netflix_countries;

            netflix_countries = Storage.get('netflix_countries');

            if (!netflix_countries) {
                return false
            }

            netflix_countries.package = Storage.get(netflix_countries.id)
            return netflix_countries;
        };

        /**
         * Removes a installed package
         * @param  {Object} config the country to set
         */

        PackageManager.prototype.selectNetflixCountry = function (country) {
            var netflix_countries, netflix_package, Runtime;

            netflix_countries = Storage.get('netflix_countries');
            netflix_package = Storage.get(netflix_countries.id);

            netflix_package.country = country.short_hand;
            netflix_countries.selected = country.short_hand;

            Storage.set('netflix_countries', netflix_countries);
            Storage.set(netflix_countries.id, netflix_package);

            Browser.getActiveTab(
                function (tab) {
                    if (tab) {
                        if (tab.url.indexOf('netflix.com') == -1) {
                            Browser.createTab('http://netflix.com/')
                        } else {
                            Browser.updateTab(tab, "https://netflix.com");
                        }
                    }
                }
            );

            Runtime = require('./runtime').Runtime;
            Runtime.restart();
            return netflix_countries;
        };

        return PackageManager;

    })();

    exports.PackageManager = new PackageManager();

}).call(this);
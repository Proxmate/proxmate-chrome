(function () {
    var PrivacyManager, Storage;

    Storage = require('./storage').Storage;

    PrivacyManager = (function () {
        function PrivacyManager() {
            this.privacy_list = {};
            this.privacy_list.trackingRules = this.privacy_list.trackingRules || {};
            this.privacy_list.malwareRules = this.privacy_list.malwareRules || [];
            this.privacy_list.phishingRules = this.privacy_list.phishingRules || [];
            this.privacy_list.adBlockingRules = this.privacy_list.adBlockingRules || {};

            this.whitelisted_rules = ["||doubleclick.net^$image,third-party", "||googleadservices.com^$third-party"];

            this.ad_blocking_list_url = "https://proxmate.me/static/lists/ad_blocking_list.txt";
            this.tracking_list_url = "https://cdn-new.proxmate.me/lists/privacy_list.txt";
            this.malware_list_url = "https://cdn-new.proxmate.me/lists/malware_list.txt";
            this.phishing_list_url = "https://cdn-new.proxmate.me/lists/phishing_list.txt";

            /**
             * bitwise mask of different request types
             */
            this.elementTypes = {
                SCRIPT: 0o1,
                IMAGE: 0o2,
                STYLESHEET: 0o4,
                OBJECT: 0o10,
                XMLHTTPREQUEST: 0o20,
                OBJECTSUBREQUEST: 0o40,
                SUBDOCUMENT: 0o100,
                DOCUMENT: 0o200,
                MAINFRAME: 0o1000,
                SUBFRAME: 0o2000,
                OTHER: 0o400,
            };

            /**
             * Maps element types to type mask.
             */
            this.elementTypeMaskMap = new Map([
                ['script', this.elementTypes.SCRIPT],
                ['image', this.elementTypes.IMAGE],
                ['stylesheet', this.elementTypes.STYLESHEET],
                ['object', this.elementTypes.OBJECT],
                ['xmlhttprequest', this.elementTypes.XMLHTTPREQUEST],
                ['object-subrequest', this.elementTypes.OBJECTSUBREQUEST],
                ['subdocument', this.elementTypes.SUBDOCUMENT],
                ['document', this.elementTypes.DOCUMENT],
                ['other', this.elementTypes.OTHER],
                ['sub_frame', this.elementTypes.SUBFRAME],
                ['main_frame', this.elementTypes.MAINFRAME]
            ]);

            this.separatorCharacters = ':?/=^';
            this.tabs = {};
            this.css_tabs = {};
        }

        PrivacyManager.prototype.init = function () {
            var _self, status, malware_status, phishing_status, ad_blocking_status;
            _self = this;
            _self.update_tracking_list(function (data) {
                _self.parse_tracking_list(data);
                _self.update_malware_list(function (data) {
                    _self.parse_malware_list(data);
                    _self.update_ad_blocking_list(function (data) {
                        _self.parse_ad_blocking_list(data);
                        _self.update_phishing_list(function (data) {
                            _self.parse_phishing_list(data);

                            status = Storage.get('proxmate_privacy_status');
                            if (status == undefined) {
                                status = true;
                                Storage.set('proxmate_privacy_status', status);
                            }

                            malware_status = Storage.get('proxmate_malware_status');
                            if (malware_status == undefined) {
                                malware_status = true;
                                Storage.set('proxmate_malware_status', malware_status);
                            }

                            phishing_status = Storage.get('proxmate_phishing_status');
                            if (phishing_status == undefined) {
                                phishing_status = true;
                                Storage.set('proxmate_phishing_status', phishing_status);
                            }

                            ad_blocking_status = Storage.get('proxmate_ad_blocking_status');
                            if (ad_blocking_status == undefined) {
                                ad_blocking_status = true;
                                Storage.set('proxmate_ad_blocking_status', ad_blocking_status);
                            }

                            //debugger_status = Storage.get('proxmate-domain-debugger');
                            //if (debugger_status == undefined) {
                            //    debugger_status = true;
                            //    Storage.set('proxmate-domain-debugger', debugger_status);
                            //}

                            console.log(_self.optionsss);
                            console.log(_self.privacy_list);
                            _self.privacy_list.last_update = new Date();
                            _self.start();
                        });
                    });
                });
            });
        };

        PrivacyManager.prototype.update_tracking_list = function (callback) {
            //var data = Storage.get("yn_tracking_list");
            var data = false;
            if (data) {
                callback(data);
                return;
            }
            $.get(this.tracking_list_url,
                function (data) {
                    //Storage.set("yn_tracking_list", data);
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.update_phishing_list = function (callback) {
            //var data = Storage.get("yn_phishing_list");
            var data = false;
            if (data) {
                callback(data);
                return;
            }
            $.get(this.phishing_list_url,
                function (data) {
                    //Storage.set("yn_phishing_list", data);
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.update_ad_blocking_list = function (callback) {
            //var data = Storage.get("yn_ad_blocking_list");
            var data = false;
            if (data) {
                callback(data);
                return;
            }
            $.get(this.ad_blocking_list_url,
                function (data) {
                    //Storage.set("yn_malware_list", data);
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.update_malware_list = function (callback) {
            //var data = Storage.get("yn_malware_list");
            var data = false;
            if (data) {
                callback(data);
                return;
            }
            $.get(this.malware_list_url,
                function (data) {
                    //Storage.set("yn_malware_list", data);
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.extractDomain = function (url) {
            var domain;
            //find & remove protocol (http, ftp, etc.) and get domain
            if (url.indexOf("://") > -1) {
                domain = url.split('/')[2];
            } else {
                domain = url.split('/')[0];
            }

            //find & remove port number
            domain = domain.split(':')[0].replace('www.', '');

            return domain;
        };

        PrivacyManager.prototype.listener = function () {
        };

        PrivacyManager.prototype.stop = function () {
            var _self = this;

            this.tabs = {};
            this.css_tabs = {};
            chrome.webRequest.onBeforeRequest.removeListener(this.listener);
        };

        PrivacyManager.prototype.start = function () {
            var _self = this;

            this.tabs = {};

            chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
                let ad_blocking_status = Storage.get('proxmate_ad_blocking_status');
                //console.log(info.status, tab.url)
                if (info.status == 'loading' && ad_blocking_status) update_css(tab);
            });

            function update_css(tab) {

                chrome.tabs.insertCSS(tab.id, {
                    file: "/ressources/css/adblock-id.css",
                    runAt: "document_start"
                });
                chrome.tabs.insertCSS(tab.id, {
                    file: "/ressources/css/adblock-class-a-k.css",
                    runAt: "document_start"
                });
                chrome.tabs.insertCSS(tab.id, {
                    file: "/ressources/css/adblock-class-l-z.css",
                    runAt: "document_start"
                });
                chrome.tabs.insertCSS(tab.id, {
                    file: "/ressources/css/adblock-tag.css",
                    runAt: "document_start"
                });

                if (tab.id in _self.css_tabs && tab.url.indexOf(_self.css_tabs[tab.id].domain) > -1) {
                    chrome.tabs.insertCSS(tab.id, {
                        code: _self.css_tabs[tab.id].rules
                    });
                }
            }

            this.listener = function (details) {
                return _self.checker(details);
            };

            chrome.webRequest.onBeforeRequest.addListener(
                this.listener,
                {urls: ["<all_urls>"]},
                ["blocking"]
            );
        };

        //PrivacyManager.prototype.displayResult = function (tab_id, domain) {
        //    chrome.tabs.executeScript(tab_id, {file: "/src/page-worker/privacy-links.js"}, function () {
        //        if (!Storage.get('proxmate-domain-debugger')) {
        //            return;
        //        }
        //
        //        chrome.tabs.sendMessage(tab_id, {
        //            tabId: tab_id,
        //            domain: domain
        //        });
        //    });
        //};

        PrivacyManager.prototype.checker = function (request_info) {
            var domain, is_third_party, is_main = false, match_parameters = {}, global_status = Storage.get('proxmate_global_status');
            var _self = this;

            if (!global_status) {
                return
            }

            if (request_info.type == 'main_frame') {
                _self.tabs[request_info.tabId] = {
                    url: request_info.url,
                    domain: _self.extractDomain(request_info.url)
                };
                is_main = true;
            }

            if (request_info.url.indexOf('proxmate.me') != -1 ||
                (
                    request_info.tabId &&
                    request_info.tabId in _self.tabs &&
                    _self.tabs[request_info.tabId].domain == 'proxmate.me'
                )
            ) {
                return
            }

            if (request_info.tabId in _self.tabs) {
                match_parameters["domain"] = _self.tabs[request_info.tabId].domain;
                match_parameters["url_domain"] = _self.extractDomain(request_info.url);
                match_parameters["third-party"] = match_parameters["url_domain"].indexOf(match_parameters["domain"]) == -1;
            } else {
                match_parameters["url_domain"] = _self.extractDomain(request_info.url);
                match_parameters["domain"] = _self.extractDomain(request_info.url);
                match_parameters["third-party"] = _self.extractDomain(request_info.url).indexOf(match_parameters["domain"]) == -1;
            }

            match_parameters["elementTypeMask"] = _self.elementTypeMaskMap.get(request_info.type);
            var result = _self.matches(
                request_info.url,
                match_parameters,
                is_main
            );
            switch (result) {
                case 1:
                    return {cancel: true};
                    break;
                case 2:
                    return {redirectUrl: "https://proxmate.me/warning/"};
                    break;
                case 3:
                    return {redirectUrl: "https://proxmate.me/warning/"};
                    break;
                case 5:
                    return {cancel: true};
                    break;
                default:
                    if (result.length > 0) {
                        let rules = "";
                        for (let i = 0; i < result.length; i++) {
                            if (i == result.length - 1) {
                                rules += result[i]
                            } else {
                                rules += result[i] + ", "
                            }
                        }

                        rules += " { display: none }";

                        _self.css_tabs[request_info.tabId] = {
                            domain: _self.tabs[request_info.tabId].domain,
                            rules: rules
                        };
                    }
            }
        };

        PrivacyManager.prototype.filterDataContainsOption = function (parsedFilterData, option) {
            return parsedFilterData.options &&
                parsedFilterData.options.binaryOptions &&
                parsedFilterData.options.binaryOptions.has(option);
        };

        PrivacyManager.prototype.isThirdPartyHost = function (baseContextHost, testHost) {
            if (!testHost.endsWith(baseContextHost)) {
                return true;
            }

            var c = testHost[testHost.length - baseContextHost.length - 1];
            return c !== '.' && c !== undefined;
        };

        PrivacyManager.prototype.parse_phishing_list = function (input) {
            var _self = this, startPos = 0, endPos = input.length, newline = '\n';
            while (startPos <= input.length) {
                endPos = input.indexOf(newline, startPos);
                if (endPos === -1) {
                    newline = '\r';
                    endPos = input.indexOf(newline, startPos);
                }
                if (endPos === -1) {
                    endPos = input.length;
                }
                var filter = input.substring(startPos, endPos);

                if (_self.whitelisted_rules.indexOf(filter) != -1) {
                    startPos = endPos + 1;
                    continue;
                }
                var parsedFilterData = {};
                if (_self.parseFilter(filter, parsedFilterData)) {
                    _self.privacy_list.phishingRules.push(parsedFilterData);
                }
                startPos = endPos + 1;
            }
        };

        PrivacyManager.prototype.parse_malware_list = function (input) {
            var _self = this, startPos = 0, endPos = input.length, newline = '\n';
            while (startPos <= input.length) {
                endPos = input.indexOf(newline, startPos);
                if (endPos === -1) {
                    newline = '\r';
                    endPos = input.indexOf(newline, startPos);
                }
                if (endPos === -1) {
                    endPos = input.length;
                }
                var filter = "||" + input.substring(startPos, endPos) + "$main_frame";

                //var filter = input.substring(startPos, endPos);
                if (_self.whitelisted_rules.indexOf(filter) != -1) {
                    startPos = endPos + 1;
                    continue;
                }
                var parsedFilterData = {};
                if (_self.parseFilter(filter, parsedFilterData)) {
                    _self.privacy_list.malwareRules.push(parsedFilterData);
                }
                startPos = endPos + 1;
            }
        };

        PrivacyManager.prototype.parse_tracking_list = function (input) {
            var _self = this, startPos = 0, endPos = input.length, newline = '\n';

            _self.privacy_list.trackingRules.htmlRuleFilters = _self.privacy_list.trackingRules.htmlRuleFilters || [];
            _self.privacy_list.trackingRules.exceptionFilters = _self.privacy_list.trackingRules.exceptionFilters || [];
            _self.privacy_list.trackingRules.domainFilters = _self.privacy_list.trackingRules.domainFilters || [];
            _self.privacy_list.trackingRules.genericFilters = _self.privacy_list.trackingRules.genericFilters || [];

            input = input + '\n@@||cxense.com^$domain=abc.go.com';
            input = input + '\n@@||w88.go.com^$domain=abc.go.com';
            input = input + '\n@@||scorecardresearch.com^$domain=abc.go.com';

            while (startPos <= input.length) {
                endPos = input.indexOf(newline, startPos);
                if (endPos === -1) {
                    newline = '\r';
                    endPos = input.indexOf(newline, startPos);
                }
                if (endPos === -1) {
                    endPos = input.length;
                }
                var filter = input.substring(startPos, endPos);
                if (_self.whitelisted_rules.indexOf(filter) != -1) {
                    startPos = endPos + 1;
                    continue;
                }
                var parsedFilterData = {};
                if (_self.parseFilter(filter, parsedFilterData)) {
                    if (parsedFilterData.htmlRuleSelector) {
                        _self.privacy_list.trackingRules.htmlRuleFilters.push(parsedFilterData);
                    } else if (parsedFilterData.isException) {
                        _self.privacy_list.trackingRules.exceptionFilters.push(parsedFilterData);
                    //} else if (parsedFilterData.hasDomainRule) {
                    //    _self.privacy_list.trackingRules.domainFilters.push(parsedFilterData);
                    } else {
                        _self.privacy_list.trackingRules.genericFilters.push(parsedFilterData);
                        //if ("binaryOptions" in parsedFilterData.options || "elementTypeMask" in parsedFilterData.options) {
                        //    //console.log(parsedFilterData.options)
                        //} else {
                        //    _self.privacy_list.trackingRules.genericFilters.push(parsedFilterData);
                        //}
                    }
                }
                startPos = endPos + 1;
            }
        };

        PrivacyManager.prototype.parse_ad_blocking_list = function (input) {
            var _self = this, startPos = 0, endPos = input.length, newline = '\n';

            _self.privacy_list.adBlockingRules.htmlRuleFilters = _self.privacy_list.adBlockingRules.htmlRuleFilters || [];
            _self.privacy_list.adBlockingRules.exceptionFilters = _self.privacy_list.adBlockingRules.exceptionFilters || [];
            _self.privacy_list.adBlockingRules.domainFilters = _self.privacy_list.adBlockingRules.domainFilters || [];
            _self.privacy_list.adBlockingRules.genericFilters = _self.privacy_list.adBlockingRules.genericFilters || [];

            while (startPos <= input.length) {
                endPos = input.indexOf(newline, startPos);
                if (endPos === -1) {
                    newline = '\r';
                    endPos = input.indexOf(newline, startPos);
                }
                if (endPos === -1) {
                    endPos = input.length;
                }
                var filter = input.substring(startPos, endPos);
                if (_self.whitelisted_rules.indexOf(filter) != -1) {
                    startPos = endPos + 1;
                    continue;
                }
                var parsedFilterData = {};
                if (_self.parseFilter(filter, parsedFilterData)) {
                    if (parsedFilterData.htmlRuleSelector) {
                        _self.privacy_list.adBlockingRules.htmlRuleFilters.push(parsedFilterData);
                    } else if (parsedFilterData.isException) {
                        _self.privacy_list.adBlockingRules.exceptionFilters.push(parsedFilterData);
                    //} else if (parsedFilterData.hasDomainRule) {
                    //    _self.privacy_list.adBlockingRules.domainFilters.push(parsedFilterData);
                    } else {
                        _self.privacy_list.adBlockingRules.genericFilters.push(parsedFilterData);
                        //if ("binaryOptions" in parsedFilterData.options || "elementTypeMask" in parsedFilterData.options) {
                        //    //console.log(parsedFilterData.options)
                        //} else {
                        //    _self.privacy_list.adBlockingRules.genericFilters.push(parsedFilterData);
                        //}
                    }
                }
                startPos = endPos + 1;
            }
        };

        PrivacyManager.prototype.parseHTMLFilter = function (input, index, parsedFilterData) {
            var domainsStr = input.substring(0, index);
            parsedFilterData.options = {
                check_options: []
            };
            if (domainsStr.length > 0) {
                this.parseDomains(domainsStr, ',', parsedFilterData.options);
            }

            // The XOR parsedFilterData.elementHidingException is in case the rule already
            // was specified as exception handling with a prefixed @@
            parsedFilterData.isException = !!(input[index + 1] === '@' ^ parsedFilterData.isException);
            if (input[index + 1] === '@') {
                // Skip passed the first # since @# is 2 chars same as ##
                index++;
            }
            parsedFilterData.htmlRuleSelector = input.substring(index + 2);
        };

        PrivacyManager.prototype.parseDomains = function (input, separator, options) {
            options.domains = options.domains || [];
            options.skipDomains = options.skipDomains || [];
            var domains = input.split(separator);
            options.domains = options.domains.concat(domains.filter(function (domain) {
                return domain[0] !== '~';
            }));
            options.skipDomains = options.skipDomains.concat(domains.filter(function (domain) {
                return domain[0] === '~';
            }).map(function (domain) {
                return domain.substring(1);
            }));
        };

        PrivacyManager.prototype.parseOptions = function (input) {
            var _self = this;
            var output = {
                binaryOptions: new Set(),
                check_options: ['third_party_option']
            };
            input.split(',').forEach(function (option) {
                option = option.trim();
                if (option.startsWith('domain=')) {
                    var domainString = option.split('=')[1].trim();
                    _self.parseDomains(domainString, '|', output);
                    output.check_options.push('domain_option')
                } else {
                    var optionWithoutPrefix = option[0] === '~' ? option.substring(1) : option;
                    if (_self.elementTypeMaskMap.has(optionWithoutPrefix)) {
                        if (option[0] === '~') {
                            output.skipElementTypeMask |= _self.elementTypeMaskMap.get(optionWithoutPrefix);
                        } else {
                            output.elementTypeMask |= _self.elementTypeMaskMap.get(optionWithoutPrefix);
                        }
                        output.check_options.push('elementTypeMask_option')
                    }
                    output.binaryOptions.add(option);
                }
            });
            return output;
        };

        PrivacyManager.prototype.parseFilter = function (input, parsedFilterData) {
            var _self = this;

            input = input.trim();
            parsedFilterData.rawFilter = input;
            parsedFilterData.filter_methods = [];

            // Check for comment or nothing
            if (input.length === 0) {
                return false;
            }

            // Check for comments
            var beginIndex = 0;
            if (input[beginIndex] === '[' || input[beginIndex] === '!') {
                parsedFilterData.isComment = true;
                return false;
            }

            // Check for exception instead of filter
            parsedFilterData.isException = input[beginIndex] === '@' && input[beginIndex + 1] === '@';
            if (parsedFilterData.isException) {
                beginIndex = 2;
            }

            // Check for element hiding rules
            var index = input.indexOf('#', beginIndex);
            if (index !== -1) {
                if (input[index + 1] === '#' || input[index + 1] === '@') {
                    _self.parseHTMLFilter(input.substring(beginIndex), index - beginIndex, parsedFilterData);
                    // HTML rules cannot be combined with other parsing,
                    // other than @@ exception marking.
                    return true;
                }
            }

            // Check for options, regex can have options too so check this before regex
            index = input.indexOf('$', beginIndex);
            if (index !== -1) {
                parsedFilterData.options = _self.parseOptions(input.substring(index + 1));
                // Get rid of the trailing options for the rest of the parsing
                input = input.substring(0, index);
            } else {
                parsedFilterData.options = {
                    check_options: []
                };
            }

            // Check for a regex
            if (input[beginIndex] === '/' && input[input.length - 1] === '/' && beginIndex !== input.length - 1) {
                parsedFilterData.isRegex = true;
                parsedFilterData.data = input.slice(beginIndex + 1, -1);
                parsedFilterData.regex = new RegExp(parsedFilterData.data);
                parsedFilterData.filter_methods.push("is_regex");
                return true;
            }

            // Check if there's some kind of anchoring
            if (input[beginIndex] === '|') {
                // Check for an anchored domain name
                if (input[beginIndex + 1] === '|') {
                    parsedFilterData.hostAnchored = true;
                    var indexOfSep = _self.findFirstSeparatorChar(input, beginIndex + 1);
                    if (indexOfSep === -1) {
                        indexOfSep = input.length;
                    }
                    beginIndex += 2;
                    parsedFilterData.host = input.substring(beginIndex, indexOfSep);
                } else {
                    parsedFilterData.leftAnchored = true;
                    beginIndex++;
                }
            }
            if (input[input.length - 1] === '|') {
                parsedFilterData.rightAnchored = true;
                input = input.substring(0, input.length - 1);
            }

            if (parsedFilterData.leftAnchored && parsedFilterData.rightAnchored) {
                parsedFilterData.filter_methods.push("left_right_anchored")
            } else if (parsedFilterData.leftAnchored) {
                parsedFilterData.filter_methods.push("left_anchored")
            } else if (parsedFilterData.rightAnchored) {
                parsedFilterData.filter_methods.push("right_anchored")
            } else if (parsedFilterData.hostAnchored) {
                parsedFilterData.filter_methods.push("host_anchored")
            }

            parsedFilterData.data = input.substring(beginIndex) || '*';
            if( parsedFilterData.rawFilter == "||docs.google.com/stat|$xmlhttprequest") {
                console.log(parsedFilterData.data.split('*').length, parsedFilterData.data != '*')
                console.log(parsedFilterData.data.split("*"))
            }

            if (parsedFilterData.data.split('*').length && parsedFilterData.data != '*') {
                parsedFilterData.isWildcard = true;
                parsedFilterData.parts = parsedFilterData.data.split('*')
                parsedFilterData.filter_methods.push("wildcard");
            }

            if (parsedFilterData.options.check_options.indexOf("domain_option") != -1) {
                parsedFilterData.hasDomainRule = true
            }

            return true;
        };

        PrivacyManager.prototype.findFirstSeparatorChar = function (input, startPos) {
            for (var i = startPos; i < input.length; i++) {
                if (this.separatorCharacters.indexOf(input[i]) !== -1) {
                    return i;
                }
            }
            return -1;
        };

        PrivacyManager.prototype.matchHTMLOptions = function (parsedFilterData, input, contextParams) {
            var _self = this;

            // Domain option check
            if (contextParams.domain !== undefined && parsedFilterData.options) {
                if (parsedFilterData.options.domains || parsedFilterData.options.skipDomains) {
                    // Get the domains that should be considered
                    var shouldBlockDomains = parsedFilterData.options.domains.filter(function (domain) {
                        return !_self.isThirdPartyHost(domain, contextParams.domain);
                    });

                    var shouldSkipDomains = parsedFilterData.options.skipDomains.filter(function (domain) {
                        return !_self.isThirdPartyHost(domain, contextParams.domain);
                    });
                    // Handle cases like: example.com|~foo.example.com should llow for foo.example.com
                    // But ~example.com|foo.example.com should block for foo.example.com
                    var leftOverBlocking = shouldBlockDomains.filter(function (shouldBlockDomain) {
                        return shouldSkipDomains.every(function (shouldSkipDomain) {
                            return _self.isThirdPartyHost(shouldBlockDomain, shouldSkipDomain);
                        });
                    });
                    var leftOverSkipping = shouldSkipDomains.filter(function (shouldSkipDomain) {
                        return shouldBlockDomains.every(function (shouldBlockDomain) {
                            return _self.isThirdPartyHost(shouldSkipDomain, shouldBlockDomain);
                        });
                    });

                    // If we have none left over, then we shouldn't consider this a match
                    if (shouldBlockDomains.length === 0 && parsedFilterData.options.domains.length !== 0 || shouldBlockDomains.length > 0 && leftOverBlocking.length === 0 || shouldSkipDomains.length > 0 && leftOverSkipping.length > 0) {
                        return true;
                    }

                    return false;
                    //return true;
                }
            }
            return true;
        };

        PrivacyManager.prototype.matchOptions = function (parsedFilterData, input, contextParams) {
            var _self = this;

            // Domain option check
            if (contextParams.domain !== undefined && parsedFilterData.options) {
                if (parsedFilterData.options.domains || parsedFilterData.options.skipDomains) {
                    // Get the domains that should be considered


                }
            }

            // If we're in the context of third-party site, then consider third-party option checks
            if (contextParams['third-party'] !== undefined) {
                // Is the current rule check for third party only?
                if (_self.filterDataContainsOption(parsedFilterData, 'third-party')) {
                    var inputHost = contextParams.url_domain;
                    var inputHostIsThirdParty = _self.isThirdPartyHost(parsedFilterData.host, inputHost);
                    if (inputHostIsThirdParty || !contextParams['third-party']) {
                        return false;
                    }
                }
            }

            return true;
        };

        PrivacyManager.prototype.hasMatchingFilters = function (filters, input, contextParams) {
            var _self = this;
            var foundFilter = filters.find(function (parsedFilterData2) {
                return _self.matchesFilter(parsedFilterData2, input, contextParams);
            });

            //if (foundFilter) { console.log(input, contextParams, foundFilter) }

            return !!foundFilter;
        };

        PrivacyManager.prototype.hasMatchingHTMLFilters = function (filters, input, contextParams) {
            var _self = this;
            var rules = []
            var foundFilter = filters.find(function (parsedFilterData2) {
                if (_self.matchesHTMLFilter(parsedFilterData2, input, contextParams)) {
                    rules.push(parsedFilterData2.htmlRuleSelector);
                }
            });

            //if (rules) { console.log(input, contextParams, foundFilter) }

            return rules;
        };

        PrivacyManager.prototype.isThirdPartyHost = function (baseContextHost, testHost) {
            if (!testHost.endsWith(baseContextHost)) {
                return true;
            }

            var c = testHost[testHost.length - baseContextHost.length - 1];
            return c !== '.' && c !== undefined;
        };

        PrivacyManager.prototype.getDomainIndex = function (input) {
            var index = input.indexOf(':');
            ++index;
            while (input[index] === '/') {
                index++;
            }
            return index;
        };

        PrivacyManager.prototype.left_anchored = function (parsedFilterData, input, contextParams) {
            return input.substring(0, parsedFilterData.data.length) === parsedFilterData.data
        };

        PrivacyManager.prototype.elementTypeMask_option = function (parsedFilterData, input, contextParams) {
            if (parsedFilterData.options.elementTypeMask !== undefined && !(parsedFilterData.options.elementTypeMask & contextParams.elementTypeMask)) {
                return false;
            }

            return !(parsedFilterData.options.skipElementTypeMask !== undefined && parsedFilterData.options.skipElementTypeMask & contextParams.elementTypeMask);
        };

        PrivacyManager.prototype.third_party_option = function (parsedFilterData, input, contextParams) {
            if (this.filterDataContainsOption(parsedFilterData, 'third-party')) {
                var inputHost = contextParams.url_domain;
                var inputHostIsThirdParty = this.isThirdPartyHost(parsedFilterData.host, inputHost);
                if (inputHostIsThirdParty || !contextParams['third-party']) {
                    return false;
                }
            }
            return true;
        };

        PrivacyManager.prototype.domain_option = function (parsedFilterData, input, contextParams) {
            var _self = this;
            var shouldBlockDomains = parsedFilterData.options.domains.filter(function (domain) {
                return !_self.isThirdPartyHost(domain, contextParams.domain);
            });

            var shouldSkipDomains = parsedFilterData.options.skipDomains.filter(function (domain) {
                return !_self.isThirdPartyHost(domain, contextParams.domain);
            });
            var leftOverBlocking = shouldBlockDomains.filter(function (shouldBlockDomain) {
                return shouldSkipDomains.every(function (shouldSkipDomain) {
                    return _self.isThirdPartyHost(shouldBlockDomain, shouldSkipDomain);
                });
            });
            var leftOverSkipping = shouldSkipDomains.filter(function (shouldSkipDomain) {
                return shouldBlockDomains.every(function (shouldBlockDomain) {
                    return _self.isThirdPartyHost(shouldSkipDomain, shouldBlockDomain);
                });
            });

            // If we have none left over, then we shouldn't consider this a match
            return !(shouldBlockDomains.length === 0 && parsedFilterData.options.domains.length !== 0 || shouldBlockDomains.length > 0 && leftOverBlocking.length === 0 || shouldSkipDomains.length > 0 && leftOverSkipping.length > 0);
        };

        PrivacyManager.prototype.right_anchored = function (parsedFilterData, input, contextParams) {
            return input.slice(-parsedFilterData.data.length) === parsedFilterData.data;
        };

        PrivacyManager.prototype.left_right_anchored = function (parsedFilterData, input, contextParams) {
            return parsedFilterData.data === input;
        };

        PrivacyManager.prototype.host_anchored = function (parsedFilterData, input, contextParams) {
            return !this.isThirdPartyHost(parsedFilterData.host, this.getUrlHost(input)) && this.indexOfFilter(input, parsedFilterData.data) !== -1
        };

        PrivacyManager.prototype.is_regex = function (parsedFilterData, input, contextParams) {
            return parsedFilterData.regex.test(input)
        };

        PrivacyManager.prototype.wildcard = function (parsedFilterData, input, contextParams) {
            try {
                var index = 0;
                for (var part of parsedFilterData.parts) {

                    var newIndex = this.indexOfFilter(input, part, index);

                    if (newIndex === -1) {
                        return false;
                    }
                    index = newIndex + part.length;
                }
            } catch (e) {
                console.error(e, input, parsedFilterData);
            }
            return true;
        };


        PrivacyManager.prototype.matchesHTMLFilter = function (parsedFilterData, input, contextParams) {
            return !this.matchHTMLOptions(parsedFilterData, input, contextParams);
        };

        PrivacyManager.prototype.matchesFilter = function (parsedFilterData, input, contextParams) {
            var _self = this;
            var optionMatcher = parsedFilterData.options.check_options.every(function (method) {
                return _self[method](parsedFilterData, input, contextParams);
            });

            if (!optionMatcher) {
                return false
            }

            var methodMatcher = parsedFilterData.filter_methods.find(function (option) {
                return _self[option](parsedFilterData, input, contextParams);
            });
            //if (methodMatcher) { console.log(methodMatcher, parsedFilterData, input) }
            return !!methodMatcher;
        };

        PrivacyManager.prototype.getUrlHost = function (input) {
            var _self = this;

            var domainIndexStart = _self.getDomainIndex(input);
            var domainIndexEnd = _self.findFirstSeparatorChar(input, domainIndexStart);
            if (domainIndexEnd === -1) {
                domainIndexEnd = input.length;
            }
            return input.substring(domainIndexStart, domainIndexEnd);
        };

        PrivacyManager.prototype.indexOfFilter = function (input, filter, startingPos) {
            if (filter.length > input.length) {
                return -1;
            }

            var filterParts = filter.split('^');
            var index = startingPos;
            var beginIndex = -1;
            var prefixedSeparatorChar = false;

            for (var f = 0; f < filterParts.length; f++) {
                if (filterParts[f] === '') {
                    prefixedSeparatorChar = true;
                    continue;
                }

                index = input.indexOf(filterParts[f], index);
                if (index === -1) {
                    return -1;
                }
                if (beginIndex === -1) {
                    beginIndex = index;
                }

                if (prefixedSeparatorChar) {
                    if (this.separatorCharacters.indexOf(input[index - 1]) === -1) {
                        return -1;
                    }
                }
                // If we are in an in between filterPart
                if (f + 1 < filterParts.length &&
                        // and we have some chars left in the input past the last filter match
                    input.length > index + filterParts[f].length) {
                    if (this.separatorCharacters.indexOf(input[index + filterParts[f].length]) === -1) {
                        return -1;
                    }
                }

                prefixedSeparatorChar = false;
            }
            return beginIndex;
        };

        PrivacyManager.prototype.matches = function (input, contextParams, isMain) {
            var _self = this;

            var ad_blocking_status = Storage.get('proxmate_ad_blocking_status');
            if (!isMain && ad_blocking_status && _self.hasMatchingFilters(_self.privacy_list.adBlockingRules.genericFilters, input, contextParams)) {
                if (_self.hasMatchingFilters(_self.privacy_list.adBlockingRules.exceptionFilters, input, contextParams)) {
                    return false;
                }
                return 5;
            }
            var privacy_status = Storage.get('proxmate_privacy_status');
            if (!isMain && privacy_status && _self.hasMatchingFilters(_self.privacy_list.trackingRules.genericFilters, input, contextParams)) {
                if (_self.hasMatchingFilters(_self.privacy_list.trackingRules.exceptionFilters, input, contextParams)) {
                    return false;
                }
                return 1;
            }
            var malware_status = Storage.get('proxmate_malware_status');
            if (isMain && malware_status && _self.hasMatchingFilters(_self.privacy_list.malwareRules, input, contextParams)) {
                return 2;
            }
            var phishing_status = Storage.get('proxmate_phishing_status');
            if (isMain && phishing_status && _self.hasMatchingFilters(_self.privacy_list.phishingRules, input, contextParams)) {
                return 3;
            }
            if (isMain && ad_blocking_status) {
                let rules = _self.hasMatchingHTMLFilters(_self.privacy_list.adBlockingRules.htmlRuleFilters, input, contextParams);
                return rules
            }
            return false;
        };

        return PrivacyManager;

    })();

    exports.PrivacyManager = new PrivacyManager();

}).call(this);
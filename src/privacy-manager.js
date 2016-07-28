(function () {
    var PrivacyManager, Storage;

    Storage = require('./storage').Storage;

    PrivacyManager = (function () {
        function PrivacyManager() {
            this.privacy_list = {};
            this.privacy_list.filters = this.privacy_list.filters || [];
            this.privacy_list.exceptionFilters = this.privacy_list.exceptionFilters || [];
            this.privacy_list.htmlRuleFilters = this.privacy_list.htmlRuleFilters || [];
            this.privacy_list.malwareRules = this.privacy_list.malwareRules || [];
            this.privacy_list.phishingRules = this.privacy_list.phishingRules || [];

            this.whitelisted_rules = ["||doubleclick.net^$image,third-party", "||googleadservices.com^$third-party"];

            this.tracking_list_url = "https://proxmate.me/static/lists/privacy_list.txt";
            this.malware_list_url = "https://proxmate.me/static/lists/malware_list.txt";
            this.phishing_list_url = "https://proxmate.me/static/lists/phishing_list.txt";

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
        }

        PrivacyManager.prototype.init = function () {
            var _self, status, debugger_status, malware_status;
            _self = this;
            _self.update_tracking_list(function (data) {
                Storage.set("yn_tracking_list", data);
                _self.parse_tracking_list(data);
                _self.update_malware_list(function (data) {
                    Storage.set("yn_malware_list", data);
                    _self.parse_malware_list(data);

                    status = Storage.get('proxmate_privacy_status');
                    if (status == undefined) {
                        status = true;
                        Storage.set('proxmate_privacy_status', status);
                    }

                    malware_status = Storage.get('proxmate_malware_status');
                    if (malware_status == undefined) {
                        malware_status = true;
                        Storage.set('proxmate_malware_status', status);
                    }

                    //debugger_status = Storage.get('proxmate-domain-debugger');
                    //if (debugger_status == undefined) {
                    //    debugger_status = true;
                    //    Storage.set('proxmate-domain-debugger', debugger_status);
                    //}

                    _self.start();
                    _self.privacy_list.last_update = new Date();
                    //_self.update_phishing_list(function (data) {
                    //    Storage.set("yn_phishing_list", data);
                    //    _self.parse_phishing_list(data);
                    //});
                });
            });
        };

        PrivacyManager.prototype.update_tracking_list = function (callback) {
            var data = Storage.get("yn_tracking_list");
            if (data) {
                callback(data);
                return;
            }
            $.get(this.tracking_list_url,
                function (data) {
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.update_phishing_list = function (callback) {
            var data = Storage.get("yn_phishing_list");
            if (data) {
                callback(data);
                return;
            }
            $.get(this.phishing_list_url,
                function (data) {
                    callback(data)
                }
            );
        };

        PrivacyManager.prototype.update_malware_list = function (callback) {
            var data = Storage.get("yn_malware_list");
            if (data) {
                callback(data);
                return;
            }
            $.get(this.malware_list_url,
                function (data) {
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
            domain = domain.split(':')[0];

            return domain;
        };

        PrivacyManager.prototype.listener = function () {
        };

        PrivacyManager.prototype.stop = function () {
            var _self = this;

            this.tabs = {};
            chrome.webRequest.onBeforeRequest.removeListener(this.listener);
        };

        PrivacyManager.prototype.start = function () {
            var _self = this;

            this.tabs = {};

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
            var domain, is_third_party, is_main = false, match_parameters = {}, global_status = Storage.get('proxmate_global_status');;
            var _self = this;

            if (!global_status) {
                return
            }

            if (request_info.type == 'main_frame') {
                _self.tabs[request_info.tabId] = request_info.url;
                is_main = true;
            }

            if (request_info.tabId in _self.tabs) {
                match_parameters["domain"] = _self.extractDomain(_self.tabs[request_info.tabId]);
                match_parameters["is_third_party"] = !request_info.url.indexOf(match_parameters["domain"]) > -1;
            }

            match_parameters["elementTypeMask"] = _self.elementTypeMaskMap.get(request_info.type);

            var result = _self.matches(
                request_info.url,
                match_parameters,
                is_main
            );

            //if (result && request_info.tabId > 0) {
                //_self.displayResult(request_info.tabId, _self.extractDomain(request_info.url));
            //}

            switch (result) {
                case 1:
                    //console.error(1, request_info.url);
                    return {cancel: true};
                    break;
                case 2:
                    //console.error(2, request_info.url)
                    return {redirectUrl: "https://proxmate.me/warning/"};
                    break;
                case 3:
                    //console.error(2, request_info.url)
                    return {redirectUrl: "https://proxmate.me/warning/"};
                    break;
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
                var filter = input.substring(startPos, endPos) + "$main_frame";

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
                        _self.privacy_list.htmlRuleFilters.push(parsedFilterData);
                    } else if (parsedFilterData.isException) {
                        _self.privacy_list.exceptionFilters.push(parsedFilterData);
                    } else {
                        _self.privacy_list.filters.push(parsedFilterData);
                    }
                }
                startPos = endPos + 1;
            }
        };

        PrivacyManager.prototype.parseHTMLFilter = function (input, index, parsedFilterData) {
            var domainsStr = input.substring(0, index);
            parsedFilterData.options = {};
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
                binaryOptions: new Set()
            };
            input.split(',').forEach(function (option) {
                option = option.trim();
                if (option.startsWith('domain=')) {
                    var domainString = option.split('=')[1].trim();
                    _self.parseDomains(domainString, '|', output);
                } else {
                    var optionWithoutPrefix = option[0] === '~' ? option.substring(1) : option;
                    if (_self.elementTypeMaskMap.has(optionWithoutPrefix)) {
                        if (option[0] === '~') {
                            output.skipElementTypeMask |= _self.elementTypeMaskMap.get(optionWithoutPrefix);
                        } else {
                            output.elementTypeMask |= _self.elementTypeMaskMap.get(optionWithoutPrefix);
                        }
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
                parsedFilterData.options = {};
            }

            // Check for a regex
            parsedFilterData.isRegex = input[beginIndex] === '/' && input[input.length - 1] === '/' && beginIndex !== input.length - 1;
            if (parsedFilterData.isRegex) {
                parsedFilterData.data = input.slice(beginIndex + 1, -1);
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

            parsedFilterData.data = input.substring(beginIndex) || '*';

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

        PrivacyManager.prototype.matchOptions = function (parsedFilterData, input, contextParams) {
            var _self = this;
            if (contextParams.elementTypeMask !== undefined && parsedFilterData.options) {
                if (parsedFilterData.options.elementTypeMask !== undefined && !(parsedFilterData.options.elementTypeMask & contextParams.elementTypeMask)) {
                    return false;
                }

                if (parsedFilterData.options.skipElementTypeMask !== undefined && parsedFilterData.options.skipElementTypeMask & contextParams.elementTypeMask) {
                    return false;
                }
            }

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
                        return false;
                    }
                }
            }

            // If we're in the context of third-party site, then consider third-party option checks
            if (contextParams['third-party'] !== undefined) {
                // Is the current rule check for third party only?
                if (_self.filterDataContainsOption(parsedFilterData, 'third-party')) {
                    var inputHost = _self.getUrlHost(input);
                    var inputHostIsThirdParty = _self.isThirdPartyHost(parsedFilterData.host, inputHost);
                    if (inputHostIsThirdParty || !contextParams['third-party']) {
                        return false;
                    }
                }
            }

            return true;
        };

        PrivacyManager.prototype.hasMatchingFilters = function (filters, input, contextParams, cachedInputData) {
            var _self = this;
            var foundFilter = filters.find(function (parsedFilterData2) {
                return _self.matchesFilter(parsedFilterData2, input, contextParams, cachedInputData);
            });
            if (foundFilter && cachedInputData.matchedFilters && foundFilter.rawFilter) {

                // increment the count of matches
                // we store an extra object and a count so that in the future
                // other bits of information can be recorded during match time
                if (cachedInputData.matchedFilters[foundFilter.rawFilter]) {
                    cachedInputData.matchedFilters[foundFilter.rawFilter].matches += 1;
                } else {
                    cachedInputData.matchedFilters[foundFilter.rawFilter] = {matches: 1};
                }
            }

            return !!foundFilter;
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

        PrivacyManager.prototype.matchesFilter = function (parsedFilterData, input, contextParams, cachedInputData) {
            var _self = this;
            if (!_self.matchOptions(parsedFilterData, input, contextParams)) {
                return false;
            }

            // Check for a regex match
            if (parsedFilterData.isRegex) {
                if (!parsedFilterData.regex) {
                    parsedFilterData.regex = new RegExp(parsedFilterData.data);
                }
                return parsedFilterData.regex.test(input);
            }

            // Check for both left and right anchored
            if (parsedFilterData.leftAnchored && parsedFilterData.rightAnchored) {
                return parsedFilterData.data === input;
            }

            // Check for right anchored
            if (parsedFilterData.rightAnchored) {
                return input.slice(-parsedFilterData.data.length) === parsedFilterData.data;
            }

            // Check for left anchored
            if (parsedFilterData.leftAnchored) {
                return input.substring(0, parsedFilterData.data.length) === parsedFilterData.data;
            }

            // Check for domain name anchored
            if (parsedFilterData.hostAnchored) {
                if (!cachedInputData.currentHost) {
                    cachedInputData.currentHost = _self.getUrlHost(input);
                }

                return !_self.isThirdPartyHost(parsedFilterData.host, cachedInputData.currentHost) &&
                    _self.indexOfFilter(input, parsedFilterData.data) !== -1;
            }
            try {

                // Wildcard match comparison
                var parts = parsedFilterData.data.split('*');
                var index = 0;
                for (var part of parts) {
                    var newIndex = _self.indexOfFilter(input, part, index);
                    if (newIndex === -1) {
                        return false;
                    }
                    index = newIndex + part.length;
                }
            } catch (e) {
                console.error(input, parsedFilterData);
            }

            return true;
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

            cachedInputData = {
                matchedFilters: {}
            };

            var privacy_status = Storage.get('proxmate_privacy_status');
            if (!isMain && privacy_status && _self.hasMatchingFilters(_self.privacy_list.filters, input, contextParams, cachedInputData)) {
                if (_self.hasMatchingFilters(_self.privacy_list.exceptionFilters, input, contextParams, cachedInputData)) {
                    cachedInputData.notMatchCount++;
                    return false;
                }
                return 1;
            }

            var malware_status = Storage.get('proxmate_malware_status');

            if (isMain && malware_status && _self.hasMatchingFilters(_self.privacy_list.malwareRules, input, contextParams, cachedInputData)) {
                return 2;
            }

            //var phishing_status = Storage.get('proxmate_phishing_status');
            //
            //if (isMain && phishing_status && _self.hasMatchingFilters(_self.privacy_list.phishingRules, input, contextParams, cachedInputData)) {
            //    return 3;
            //}

            return false;
        };

        return PrivacyManager;

    })();

    exports.PrivacyManager = new PrivacyManager();

}).call(this);
(function () {
    var host, path;

    host = window.location.host;
    path = window.location.pathname;

    ProxMate.getProxmateStatus(function (status) {
        if (!status) {
            return;
        }
        return ProxMate.getInstalledPackages(function (packages) {
            var contentScript, pkg, pkghost, regex, regexObject, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = packages.length; _i < _len; _i++) {
                pkg = packages[_i];
                _results.push((function () {
                    var _j, _len1, _ref, _results1;
                    _ref = pkg.hosts;
                    _results1 = [];
                    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                        pkghost = _ref[_j];
                        regex = pkghost.replace(/\./g, "\\.");
                        regex = regex.replace(/\*/g, ".*");
                        regexObject = new RegExp("^" + regex + "$", "g");
                        if (host.search(regexObject) !== -1) {
                            _results1.push((function () {
                                var _k, _len2, _ref1, _results2;
                                _ref1 = pkg.contentScripts;
                                _results2 = [];
                                for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                                    contentScript = _ref1[_k];
                                    regexObject = new RegExp(contentScript.matches, "g");
                                    if (path.search(regexObject) !== -1) {
                                        _results2.push(eval(atob(contentScript.script)));
                                    } else {
                                        _results2.push(void 0);
                                    }
                                }
                                return _results2;
                            })());
                        } else {
                            _results1.push(void 0);
                        }
                    }
                    return _results1;
                })());
            }
            return _results;
        });
    });
}).call(this);
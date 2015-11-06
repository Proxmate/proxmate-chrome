(function () {
    var insertGAScript, root;

    root = typeof exports !== "undefined" && exports !== null ? exports : this;

    root._gaq = [['_setAccount', 'UA-31118328-8'], ['_trackPageview']];

    insertGAScript = function () {
        var ga, s;
        ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.src = "https://ssl.google-analytics.com/ga.js";
        s = document.getElementsByTagName('head');
        return s[0].appendChild(ga);
    };

    insertGAScript();

}).call(this);
(function () {
    var Storage, MessageManager, Browser, Config;

    Storage = require('./storage').Storage;

    Browser = require('./browser').Browser;

    Config = require('./config').Config;

    MessageManager = (function () {
        function MessageManager() {
        }

        MessageManager.prototype.init = function () {
            var _self = this;
            // Checking every 5 minutes for messages seconds for new messages
            setInterval(function () {
                _self.get()
            }, 1200000);
        };

        MessageManager.prototype.show = function () {
            var messages = Storage.get('messages-proxmate');
            var visible = {
                unread: [],
                sticky: [],
                persistent: []
            };

            for (var i = 0; i < messages.length; i++) {
                var _oneday = 60000 * 60 * 24

                if (messages[i].is_sticky == true) {
                    if (messages[i].time_shown && ((_oneday * messages[i].time_shown ) + messages[i].received) < new Date()) {
                        messages[i].read = true;
                        continue;
                    }

                    if (messages[i].closed) {
                        continue;
                    }
                    visible.sticky.push(messages[i]);
                    continue;
                }

                if (messages[i].read == false) {
                    visible.unread.push(messages[i]);
                }
            }

            for (var i = 0; i < messages.length; i++) {
                messages[i].read = true;
            }

            Browser.setIcontext("");
            return visible;
        };

        MessageManager.prototype.closeMessage = function (timestamp) {
            var _message_list = Storage.get('messages-proxmate');

            for (var i = 0; i < _message_list.length; i++) {
                if (_message_list[i].timestamp == timestamp) {
                    _message_list[i].closed = true
                }
            }

            Storage.set('messages-proxmate', _message_list)
            return _message_list
        };

        MessageManager.prototype.get = function () {
            var api_key, checkerUrl, server, _self = this;

            api_key = Storage.get('api_key');
            server = Config.get('primary_server');
            checkerUrl = "" + server + "api/message/list/" + api_key + "/?api_v=" + window.localStorage["version"];

            if (!api_key) {
                return
            }

            $.post(
                checkerUrl,
                {
                    lastMessageTimestamp: _self.lastMessageTimestamp()
                },
                function (data) {
                    var messages = Storage.get('messages-proxmate');
                    var _newMessages = 0;
                    if (!messages || messages == "reload") {

                        // if there are no messages
                        for (var i = 0; i < data.messages.length; i++) {
                            // set new uread messages
                            if (data.messages[i].read == undefined) {
                                data.messages[i].read = false;
                                data.messages[i].received = new Date().getTime();
                                _newMessages++
                            }
                        }

                        // Store new messages
                        Storage.set('messages-proxmate', data.messages);

                        // Set new messages icon if any
                        if (data.messages.length > 0) {
                            Browser.setIcontext(data.messages.length.toString());
                        }

                        return;
                    }

                    for (var i = 0; i < data.messages.length; i++) {
                        var _isOld = false;

                        // Check and update old messages
                        for (var j = 0; j < messages.length; j++) {
                            if (data.messages[i].timestamp == messages[j].timestamp) {
                                messages[j].title = data.messages[i].title;
                                messages[j].content = data.messages[i].content;
                                messages[j].has_url = data.messages[i].has_url;
                                messages[j].time_show = data.messages[i].time_show;
                                messages[j].url = data.messages[i].url;
                                messages[j].is_sticky = data.messages[i].is_sticky;

                                if (!messages[j].received) {
                                    messages.messages[j].received = new Date().getTime();
                                }

                                if (messages[j].read == undefined) {
                                    messages[j].read = false;
                                    messages[i].received = new Date().getTime();
                                    _newMessages++

                                }
                                _isOld = true;
                            }
                        }

                        // if message is new push in array
                        if (!_isOld) {
                            if (data.messages[i].read == undefined) {
                                data.messages[i].read = false;
                                data.messages[i].received = new Date().getTime();
                                _newMessages++
                            }
                            messages.push(data.messages[i])
                        }
                    }

                    // check for messages that were deleted
                    for (var i = 0; i < messages.length; i++) {
                        var _isDeletable = true;

                        for (var j = 0; j < data.messages.length; j++) {
                            if (data.messages[j].timestamp == messages[i].timestamp) {
                                _isDeletable = false;
                            }
                        }

                        if (_isDeletable) {
                            if (!messages[i].read) {
                                _newMessages--;
                            }
                            messages.splice(i, 1)
                        }
                    }

                    chrome.browserAction.getBadgeText({}, function (value) {
                        if (!value && _newMessages > 0) {
                            Browser.setIcontext(_newMessages.toString())
                            return
                        }
                        else if (!value && _newMessages == 0) {
                            return
                        }
                        else {
                            if ((parseInt(value) + _newMessages) < 1) {
                                Browser.setIcontext("");
                            }
                            else {
                                Browser.setIcontext((parseInt(value) + _newMessages).toString());
                            }
                        }
                    });

                    Storage.set('messages-proxmate', messages);
                },
                "json"
            );
        };

        MessageManager.prototype.lastMessageTimestamp = function () {
            var _message_list = Storage.get('messages-proxmate');
            if (!_message_list || _message_list.length == 0 || _message_list == 'reload') {
                return '1273017600.0'
            }

            var _timestamp = _message_list[0].timestamp;

            for (var i = 1; i < _message_list.length; i++) {
                if (_message_list[i].timestamp > _timestamp) {
                    _timestamp = _message_list[i].timestamp
                }
            }
            return _timestamp;
        };

        return MessageManager;

    })();

    exports.MessageManager = new MessageManager();

}).call(this);
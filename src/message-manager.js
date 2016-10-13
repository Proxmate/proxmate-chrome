(function () {
    var Storage, MessageManager, Browser, Config, Status;

    MessageManager = (function () {
        function MessageManager() {
        }

        /**
         * Initialize message checking system
         */

        MessageManager.prototype.init = function () {
            Status = require('./status').Status;
            Config = require('./config').Config;
            Storage = require('./storage').Storage;
            Browser = require('./browser').Browser;
            return ((function (_self) {
                // Checking every 20 minutes for messages seconds for new messages
                Browser.setInterval(function () {
                    _self.get()
                }, 1200000);
            })(this));
        };

        /**
         * Warn user the account will expire
         */

        MessageManager.prototype.warnExpiry = function () {
            var days_left, messages, _exists;

            // get a list of all messages
            messages = Storage.get('messages-proxmate');

            // check if is not a trial subscription to remove the messages
            if (Status.getSubscriptionStatus() != 'trial' && Status.getSubscriptionStatus() != 'subscription_canceled') {
                // there are no messages
                if (!messages) {
                    return
                }
                // remove the messages because it is not a trial subscription
                for (var i = 0; i < messages.length; i++) {
                    var _message = messages[i];
                    if (_message.timestamp == 4 || _message.timestamp == 1 || _message.timestamp == 2) {
                        // message existed but timing is not now
                        messages.splice(i, 1)
                    }
                }

                // store the new messages
                return Storage.set('messages-proxmate', messages);
            }

            // get days left of subscription
            days_left = Status.getDaysLeft();


            // if message list is empty initialize with empty array
            if (!messages) {
                messages = [];
            }

            if (days_left <= 1 && days_left > 0) {
                //TODO need to make this dynamic
                // check for lowest days_left value
                for (var i = 0; i < messages.length; i++) {
                    var _message = messages[i];

                    // check if the message already exists and was previously shows
                    if (_message.timestamp == 4 || _message.timestamp == 2) {
                        // message was previously shown and need a new notification
                        _message.timestamp = 1;
                        _message.read = undefined;
                        _message.closed = false;
                        _message.is_closable = false;
                        _exists = true;

                    } else if (_message.timestamp == 1) {
                        // message is properly configured
                        _exists = true;
                    }
                }
                if (!_exists) {
                    //TODO make this configurable from the server
                    // message did not exist so push it
                    messages.push(
                        {
                            timestamp: 1,
                            title: "Your free trial expires soon",
                            content: "Click here to check out the plan options available",
                            has_url: true,
                            time_show: false,
                            url: "https://proxmate.me/pricing/",
                            is_sticky: true,
                            is_closable: false,
                            closed: false
                        }
                    )
                }
            } else if (days_left <= 2 && days_left > 0) {
                // check for next days_left value
                for (var i = 0; i < messages.length; i++) {
                    var _message = messages[i];
                    // check if the message already exists and was previously shows
                    if (_message.timestamp == 2) {
                        // message is properly configured
                        _exists = true
                    } else if (_message.timestamp == 1 || _message.timestamp == 4) {
                        // message was previously shown and need a new notification
                        _message.timestamp = 2;
                        _message.read = undefined;
                        _message.closed = false;
                        _message.is_closable = false;
                        _exists = true;
                    }
                }
                if (!_exists) {
                    // message did not exist so push it
                    messages.push(
                        {
                            timestamp: 2,
                            title: "Your free trial expires soon",
                            content: "Click here to check out the plan options available",
                            has_url: true,
                            time_show: false,
                            url: "https://proxmate.me/pricing/",
                            is_sticky: true,
                            is_closable: false,
                            closed: false
                        })
                }
            } else if (days_left <= 4 && days_left > 0) {
                // check for next days_left value
                for (var i = 0; i < messages.length; i++) {
                    var _message = messages[i];
                    if (_message.timestamp == 4) {
                        // message is properly configured
                        _exists = true
                    } else if (_message.timestamp == 1 || _message.timestamp == 2) {
                        // message was previously shown and need a new notification
                        _message.timestamp = 4;
                        _message.read = undefined;
                        _message.closed = false;
                        _message.is_closable = false;
                        _exists = true;
                    }
                }
                if (!_exists) {
                    // message did not exist so push it
                    messages.push(
                        {
                            timestamp: 4,
                            title: "Your free trial expires soon",
                            content: "Click here to check out the plan options available",
                            has_url: true,
                            time_show: false,
                            url: "https://proxmate.me/pricing/",
                            is_sticky: true,
                            is_closable: false,
                            closed: false
                        })
                }
            } else {
                // check for leftovers
                for (var i = 0; i < messages.length; i++) {
                    var _message = messages[i];
                    if (_message.timestamp == 4 || _message.timestamp == 1 || _message.timestamp == 2) {
                        // message existed but timing is not now
                        messages.splice(i, 1)
                    }
                }
            }

            // store the new messages
            return Storage.set('messages-proxmate', messages);
        };

        /**
         * Get array of all visible messages
         * @return {array}              array of visible messages
         */

        MessageManager.prototype.show = function () {
            var messages = Storage.get('messages-proxmate');
            var _oneday = 60000 * 60 * 24;
            // initialize the list of messages
            var visible = {
                unread: [],
                sticky: []
            };

            if (!messages) {
                return visible;
            }

            for (var i = 0; i < messages.length; i++) {

                // sticky messages are put in top of the list
                if (messages[i].is_sticky == true) {

                    // hide messages that should be shown for a limited time
                    if (messages[i].time_shown && ((_oneday * messages[i].time_shown ) + messages[i].received) < new Date()) {
                        messages[i].read = true;
                        continue;
                    }

                    // skip already closed messages
                    if (messages[i].closed) {
                        continue;
                    }

                    // push message as sticky
                    visible.sticky.push(messages[i]);
                    continue;
                }

                // add unread messages
                if (messages[i].read == false) {
                    visible.unread.push(messages[i]);
                }

                // make all messages that are seen now read for the counter to dissapear
                messages[i].read = true;
            }

            // Reset message counter
            Browser.setIcontext("");

            // Return list
            return visible;
        };

        /**
         * Close message
         * @param  {numeric} timestamp       initial timestamp of the message (acts as id)
         * @return {array}              new message list
         */

        MessageManager.prototype.closeMessage = function (timestamp) {
            var _message_list = Storage.get('messages-proxmate');

            // search for message and set as closed
            for (var i = 0; i < _message_list.length; i++) {
                if (_message_list[i].timestamp == timestamp) {
                    _message_list[i].closed = true
                }
            }

            Storage.set('messages-proxmate', _message_list)
            return _message_list
        };

        /**
         * Fetch message list from server
         * @param  {numeric} timestamp       initial timestamp of the message (acts as id)
         * @return {array}              new message list
         */

        MessageManager.prototype.get = function () {
            var api_key, checkerUrl, server, _self = this;

            api_key = Storage.get('api_key');
            server = Config.get('primary_server');
            checkerUrl = "" + server + "api/message/list/" + api_key + "/?api_v=" + Browser.getExtensionVersion();

            if (!api_key) {
                return
            }

            // warn user if plugin is going to expire soon
            _self.warnExpiry();

            Browser.ajax.POST(
                checkerUrl,
                {},
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
                                messages[j].is_closable = data.messages[i].is_closable;

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

                    // check for messages that were deleted and warning message
                    for (var i = 0; i < messages.length; i++) {
                        var _isDeletable = true;

                        for (var j = 0; j < data.messages.length; j++) {
                            if (data.messages[j].timestamp == messages[i].timestamp) {
                                _isDeletable = false;
                            }
                        }

                        if (messages[i].timestamp == 2 || messages[i].timestamp == 4 || messages[i].timestamp == 1) {
                            if (messages[i].read == undefined) {
                                messages[i].read = false;
                                messages[i].received = new Date().getTime();
                                _newMessages++
                            }
                            _isDeletable = false;
                        }

                        if (_isDeletable) {
                            if (!messages[i].read) {
                                _newMessages--;
                            }
                            messages.splice(i, 1)
                        }
                    }

                    Browser.getIcontext(function(value) {
                        value = parseInt(value) || 0;
                        if (!value && _newMessages > 0) {
                            Browser.setIcontext(_newMessages.toString())
                            return
                        }
                        else if (!value && _newMessages == 0) {
                            return
                        }
                        else {
                            if ((value + _newMessages) < 1) {
                                Browser.setIcontext("");
                            }
                            else {
                                Browser.setIcontext((value + _newMessages).toString());
                            }
                        }
                    });

                    Storage.set('messages-proxmate', messages);
                }
            );
        };

        return MessageManager;

    })();

    exports.MessageManager = new MessageManager();

}).call(this);
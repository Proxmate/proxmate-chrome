(function () {
    var ProxMate;
    ProxMate = function () {
        function ProxMate() {
        }

        ProxMate.prototype.emitMessage = function (c, a, b) {
            return chrome.runtime.sendMessage({action: c, params: a}, b)
        };
        ProxMate.prototype.requestActivation = function (c) {
            return this.emitMessage("requestActivation", {}, c)
        };
        ProxMate.prototype.selectNetflix = function (a, b) {
            return this.emitMessage("selectNetflix", {country: a}, b)
        };
        ProxMate.prototype.getStatus = function (a) {
            return this.emitMessage("getStatus", {}, a)
        };
        ProxMate.prototype.getApiKey = function (a) {
            return this.emitMessage("getApiKey", {}, a)
        };
        ProxMate.prototype.activatePlugin = function (a, b) {
            return this.emitMessage("activatePlugin", {activation_code: a}, b)
        };
        return ProxMate
    }();

    window.ProxMate = new ProxMate

    // specific behavior for confirmation of the account
    if (-1 !== location.href.indexOf("confirm/")) {
        var key = $("#confirmation-link").attr("data-value");
        var browser = $("#confirmation-link").attr("data-browser");
        if (key) {
            window.ProxMate.activatePlugin(key, function (result) {
                var _extra_params = '&browser=' + browser + '&activation_key=' + key;
                if (!result.success) {
                    window.location.href = '/channels/?activation=' + result.error + _extra_params;
                    return
                }

                if (result.action == 'retrieval_expired') {
                    window.location.href = '/pricing/?activation=' + result.action + _extra_params;
                    return
                }

                window.location.href = '/channels/?activation=' + result.action + _extra_params;
            })
        }
    }

    function deselectPlan(plan) {
        $("#price-list .option[data-plan=" + plan + "]")
            .removeClass('selected')
            .find('.btn-cta')
            .html('Select Plan');
    }

    function selectPlan(plan) {
        $("#price-list .option[data-plan=" + plan + "]")
            .addClass('selected')
            .css('opacity', 1)
            .find('.btn-cta')
            .html('Selected');
        $("#price-list .option[data-plan!=" + plan + "]").each(function () {
            $(this).css('opacity', .4);
            var plan = $(this).attr('data-plan');
            deselectPlan(plan);
        })
    }

    // Selecting one of the prices
    $("#price-list .option").click(function () {

        if (!window.ProxMate.plugin_key || window.ProxMate.subscription_status == 'subscribed') {
            return
        }
        var plan = $(this).attr('data-plan');
        // If we're toggling this
        if ($(this).hasClass('selected')) {
            deselectPlan(plan);
            $("#price-list .option").css('opacity', 1);
        } else {
            selectPlan(plan);
            $(".payment-options").show();
        }
    })

    var download_buttons = $('.call-to-action-button');
    var download_buttons_no_trial = $('.call-to-action-button-no-trial');
    var pricing_buttons = $('.pricing-plan-button');
    var stripe_email = $('.stripe-plan-option');
    window.ProxMate.getApiKey(function (result) {
        if (!result) {
            return
        }
        window.ProxMate.plugin_key = result;
        window.ProxMate.getStatus(function (result) {
            window.ProxMate.status = result.data;
            window.ProxMate.subscription_status = result.data.subscription_status;

            if (window.ProxMate.subscription_status == 'trial' || window.ProxMate.subscription_status == 'subscription_expired' || window.ProxMate.subscription_status == 'subscription_canceled') {
                $('.pricing-plugin-container.cta-wrapper').hide();
                stripe_email.each(function () {
                    $(this).attr("data-email", window.ProxMate.status.email)
                    $(this).attr("data-key", window.ProxMate.plugin_key)
                })

                download_buttons.html('Upgrade Now')
                download_buttons.click(function () {
                    window.location.href = '/pricing/'
                });
                $('.paypal-identifier-api-key').val(window.ProxMate.plugin_key)

                var _now = moment(new Date());
                var _end = moment(new Date(window.ProxMate.status.plan_expiration_date * 1000));
                if (_end.diff(_now, 'days') > 0) {
                    if (_end.diff(_now, 'days') > 90) {
                        if (_end.diff(_now, 'months') < 24) {
                            $('.paypal-remaining-days.amount').val(_end.diff(_now, 'months'))
                            $('.paypal-remaining-days.period').val("M")
                        }
                        else {
                            $('.paypal-remaining-days.amount').val("24")
                            $('.paypal-remaining-days.period').val("M")
                        }
                    } else {
                        $('.paypal-remaining-days.amount').val(_end.diff(_now, 'days'))
                    }
                } else {
                    $('.paypal-remaining-days').remove()
                }
                $('.no-credit-card').hide();
            }
            if (window.ProxMate.subscription_status == 'subscribed') {
                $('.pricing-plugin-container.cta-wrapper').hide();
                selectPlan(window.ProxMate.status.plan_status);
                $('#price-list .option[data-plan=' + window.ProxMate.status.plan_status + ']').find('.btn-cta').html('Your plan')
                download_buttons.html('Go To Channels');
                download_buttons.click(function () {
                    window.location.href = '/channels/'
                });
                $('.try-out.white').hide();
                $('.no-credit-card').hide();

            }
            if (!window.ProxMate.plugin_key) {
                $('.pricing-plugin-container.btn-wrapper').css('visibility', 'hidden')
            }

            $('.netflix-channel-box').each(function () {
                $(this).click(function () {
                    window.ProxMate.selectNetflix($(this).attr('data-short_hand'), function () {
                    })

                })
            })
        })
    })
}).call(this);

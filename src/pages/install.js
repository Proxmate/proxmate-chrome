(function () {
  'use strict';
  angular.module('proxmateApp', ['chrome']);
  angular.module('proxmateApp').controller('InstallCtrl', [
    '$scope',
    'Chrome',
    function ($scope, Chrome) {
      function isValidEmailAddress(emailAddress) {
        var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        return pattern.test(emailAddress);
      }
      $('.post-install form').submit(function (e) {
        e.preventDefault();
        $('.alert.alert-danger').hide(200);
        var _email = $('#email-field').val();
        if (!isValidEmailAddress(_email)) {
          $('.alert.alert-danger').text('Please provide a valid email address!');
          $('.alert.alert-danger').show(500);
          return;
        }
        $('.alert.alert-info').show(200);
        Chrome.requestActivation(_email, function (response) {
          $('.alert-card').css('opacity', 0);
          if (!response.success && response.error == 'disposable_email') {
            $('.alert.alert-info').hide();
            $('.alert.alert-danger').text('Sorry, we do not support disposable emails.  Please register with Proxmate using a standard email address, thanks!');
            $('.alert.alert-danger').show(500);

            return;
          }
          $('.alert.alert-info').hide();
          $('.container.step1').hide();
          $('.container.step2').show();
        });
        e.preventDefault();
      });
    }
  ]);
}.call(this));
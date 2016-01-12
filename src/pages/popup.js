(function () {
  'use strict';
  angular.module('proxmateApp', ['chrome']).config([
    '$compileProvider',
    function ($compileProvider) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }
  ]);
  angular.module('proxmateApp').controller('MessageCtrl', [
    '$scope',
    'Chrome',
    '$http',
    function ($scope, Chrome) {
      $scope.messages = {
        unread: [],
        sticky: [],
        persistent: []
      };
      $scope.init = function () {
        Chrome.showMessages(function (response) {
          if (!response) {
            return;
          }
          $scope.messages = response;
          $scope.$apply();
        });
      };
      $scope.closeMessage = function (id) {
        Chrome.closeMessage(id, function (response) {
          Chrome.showMessages(function (response) {
            if (!response) {
              return;
            }
            $scope.messages = response;
            $scope.$apply();
          });
        });
      };
      return $scope.init();
    }
  ]);
  angular.module('proxmateApp').controller('PopupCtrl', [
    '$scope',
    'Chrome',
    function ($scope, Chrome) {
      $scope.updateProxmateStatus = function () {
        return Chrome.getProxmateStatus(function (response) {
          $scope.proxmateStatus = response;
          return $scope.$apply();
        });
      };
      $scope.fetchInstalledPackages = function () {
        return Chrome.getInstalledPackages(function (packages) {
          $scope.installedPackages = packages;
          return $scope.$digest();
        });
      };
      $scope.toggleProxmate = function () {
        if ($scope.subscription_status == 'subscription_expired') {
          newStatus = false;
        } else {
          var newStatus = !$scope.proxmateStatus;
        }
        return Chrome.setProxmateStatus(newStatus, function () {
          return $scope.updateProxmateStatus();
        });
      };
      $scope.netflix_countries = null;
      $scope.netflix_selected_country = null;
      Chrome.checkForUpdates();
      var get_time_difference = function (date_future) {
        var today = new Date();
        var _future_time = new Date(date_future * 1000);
        var diffMs = _future_time - today;
        // milliseconds between now & Christmas
        var diffDays = Math.round(diffMs / 86400000);
        // days
        var diffHrs = Math.round(diffMs % 86400000 / 3600000);
        // hours
        var diffMins = Math.round(diffMs % 86400000 % 3600000 / 60000);
        // minutes
        return {
          days: diffDays,
          hours: diffHrs
        };
      };
      var get_expiry_date = function (date_future) {
        var _future_time = new Date(date_future * 1000);
        var monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
          ];
        var month = _future_time.getUTCMonth();
        //months from 1-12
        var day = _future_time.getUTCDate();
        var year = _future_time.getUTCFullYear();
        return day + '/' + monthNames[month] + '/' + year;
      };
      Chrome.updateStatus(function (response) {
        var remaining_time;
        remaining_time = get_time_difference(response.data.plan_expiration_date);
        $scope.currentPlan = response.data.plan_status;
        $scope.plan_status = response.data.plan_status;
        $scope.user_email = response.data.email;
        $scope.subscription_status = response.data.subscription_status;
        $scope.payment_status = response.data.payment_status;
        $scope.subscription_name = response.data.subscription_name;
        $scope.subscription_supplier = response.data.subscription_supplier;
        //$scope.remainingTime = gettime(response.data.plan_expiration_date) + ' / ' + new Date(response.data.plan_expiration_date).toGMTString();
        $scope.remainingTime = remaining_time.days ? remaining_time.days : 'TODAY';
        $scope.remainingTime_unit = remaining_time.days ? 'Days' : '';
        $scope.next_payment = get_expiry_date(response.data.plan_expiration_date);
        $scope.api_key = response.api_key;
        $scope.$apply();
      });
      Chrome.getNetflixCountries(function (response) {
        var _callback = function () {
          $scope.netflix_selected_country = response.selected;
          var _additional_countries = response['package'].additional_countries;
          _additional_countries.sort(function (a, b) {
            if (a.title < b.title)
              return -1;
            if (a.title > b.title)
              return 1;
            return 0;
          });
          for (var i = 0; i < _additional_countries.length; i++) {
            _additional_countries[i].title = _additional_countries[i].title.replace('Netflix', ' ');
            _additional_countries[i].flag = _additional_countries[i].short_hand.slice(0, 2);
            if (_additional_countries[i].title.indexOf('States') != -1) {
              _additional_countries.splice(0, 0, _additional_countries.splice(i, 1)[0]);
            }
            if (_additional_countries[i].title.indexOf('Kingdom') != -1) {
              if (_additional_countries[0].title.indexOf('States') != -1) {
                _additional_countries.splice(1, 0, _additional_countries.splice(i, 1)[0]);
              } else {
                _additional_countries.splice(0, 0, _additional_countries.splice(i, 1)[0]);
              }
            }
          }
          $scope.netflix_countries = _additional_countries;
          $scope.$apply();
          $('.selector').mCustomScrollbar({
            theme: 'minimal-dark',
            scrollInertia: 0
          });
        };
        if (!response) {
          setTimeout(function () {
            Chrome.getNetflixCountries(_callback);
          }, 1000);
          return;
        }
        _callback();
      });
      $scope.selectCountry = function (country) {
        Chrome.selectNetflixCountry(country, function (response) {
          var _additional_countries = response['package'].additional_countries;
          $scope.netflix_selected_country = response.selected;
          // Correct the flags to be correctly named after the Country short_hand
          // Country short_hand naming convention is XX_hulu XX being the country, e.g. US_hulu
          for (var i = 0; i < _additional_countries.length; i++) {
            _additional_countries[i].flag = _additional_countries[i].short_hand.slice(0, 2);
          }
          // Sort alphabetically
          _additional_countries.sort(function (a, b) {
            if (a.title < b.title)
              return -1;
            if (a.title > b.title)
              return 1;
            return 0;
          });
          // Correct some naming conventions and put US and UK in top if the list
          for (var i = 0; i < _additional_countries.length; i++) {
            // Remove Netflix from the countries names
            _additional_countries[i].title = _additional_countries[i].title.replace('Netflix', ' ');
            _additional_countries[i].flag = _additional_countries[i].short_hand.slice(0, 2);
            if (_additional_countries[i].title.indexOf('States') != -1) {
              _additional_countries.splice(0, 0, _additional_countries.splice(i, 1)[0]);
            }
            if (_additional_countries[i].title.indexOf('Kingdom') != -1) {
              if (_additional_countries[0].title.indexOf('States') != -1) {
                _additional_countries.splice(1, 0, _additional_countries.splice(i, 1)[0]);
              } else {
                _additional_countries.splice(0, 0, _additional_countries.splice(i, 1)[0]);
              }
            }
          }
          $scope.netflix_countries = _additional_countries;
          $scope.$apply();
        });
      };
      $scope.update_card = function () {
        $scope.openTab('https://web.proxmate.me/change-card/' + $scope.api_key + '/');
      };
      $scope.unsubscribe = function () {
        $scope.openTab('https://web.proxmate.me/unsubscribe/' + $scope.api_key + '/');
      };
      $scope.openTab = function (url) {
        chrome.tabs.create({ url: url });
      };
      $('#show_account_page').click();
      var carousel = $('#content').carousel({ interval: false });
      $('footer li a').click(function () {
        var slideNr = parseInt($(this).attr('data-slide-to'));
        $('footer li').removeClass('active');
        $(this).parent().addClass('active');
        $('#content').carousel(slideNr);
      });
      return $scope.updateProxmateStatus();
    }
  ]);
}.call(this));
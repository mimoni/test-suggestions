"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Suggestion = /*#__PURE__*/function () {
  function Suggestion(_ref) {
    var input = _ref.input,
        suggestion = _ref.suggestion;

    _classCallCheck(this, Suggestion);

    this.MAX_FILES = 7;
    this.inputEl = input;
    this.suggestionEl = suggestion;
    this.template = document.querySelector('#js-suggestion-template');
    this.header = document.querySelector('.js-header');

    this._setListeners();

    this._initVue();
  }

  _createClass(Suggestion, [{
    key: "_setListeners",
    value: function _setListeners() {
      var _this = this;

      this.inputEl.addEventListener('input', window.debounce(function (_ref2) {
        var target = _ref2.target;

        if (target.value.length > 2) {
          _this._updateData();

          _this.app.query = target.value;
        } else {
          _this.app.$emit('close-suggestion');
        }
      }, 250));
      this.header && this.header.addEventListener('click', function (_ref3) {
        var target = _ref3.target;

        if (_this.inputEl !== target) {
          _this.app.$emit('close-suggestion');
        }
      });
    }
  }, {
    key: "_initVue",
    value: function _initVue() {
      this.app = new Vue({
        el: this.suggestionEl,
        template: this.template,
        delimiters: ['<%', '%>'],
        // {{ vars }} - используется в panini
        data: function data() {
          return {
            query: '',
            isOpen: false,
            suggestion: {}
          };
        },
        created: function created() {
          var _this2 = this;

          this.$on('close-suggestion', function () {
            _this2.isOpen = false;
          });
          this.$on('open-suggestion', function () {
            _this2.isOpen = true;
          });
        },
        methods: {
          productArrayToObject: function productArrayToObject(array) {
            return array.map(function (item) {
              return {
                name: item[1],
                link: item[2],
                desc: item[3],
                price: item[4],
                currency: item[6],
                pack: item[8],
                company: item[9]
              };
            });
          },
          plural: function plural(count, words) {
            var cases = [2, 0, 1, 1, 1, 2];
            return count + ' ' + words[count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]];
          },
          pluralProduct: function pluralProduct(count) {
            var words = ['товар', 'товара', 'товаров'];
            return this.plural(count, words);
          },
          pluralResult: function pluralResult(count) {
            var words = ['результат', 'результата', 'результатов'];
            return this.plural(count, words);
          },
          getHrefByTypeName: function getHrefByTypeName(name) {
            return "/".concat(name, "/?search=").concat(this.query);
          }
        },
        computed: {
          productMore: function productMore() {
            return this.suggestion.products.count - this.suggestion.products.items.length;
          }
        },
        filters: {
          rusType: function rusType(value) {
            var dictionary = {
              'articles': 'Статьях',
              'tags': 'Тегах',
              'interiors': 'Интерьерах',
              'tenders': 'Тендерах',
              'questions': 'Форуме',
              'firms': 'Фирмах',
              'sections': 'Каталоге'
            };
            return dictionary[value];
          }
        }
      }); // this._updateData();

      window.app = this.app;
    }
  }, {
    key: "_queryMock",
    value: function _queryMock() {
      return Math.floor(Math.random() * Math.floor(this.MAX_FILES));
    }
  }, {
    key: "_updateData",
    value: function _updateData() {
      var _this3 = this;

      fetch("/json/ajax/".concat(this._queryMock(), ".json")).then(function (response) {
        return response.json();
      }).then(function (data) {
        _this3.app.suggestion = _this3._checkData(data);

        _this3.app.$emit('open-suggestion');
      });
    }
  }, {
    key: "_checkData",
    value: function _checkData(data) {
      var itemCount = 0;
      Object.keys(data).forEach(function (prop) {
        itemCount += data[prop].items.length;
      });
      return itemCount ? data : [];
    }
  }]);

  return Suggestion;
}();

document.addEventListener('DOMContentLoaded', function () {
  var input = document.querySelector('.js-suggestion-input');
  var suggestion = document.querySelector('.js-suggestion');
  new Suggestion({
    input: input,
    suggestion: suggestion
  });
});
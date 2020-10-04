class Suggestion {
    constructor({ input, suggestion }) {
        this.MAX_FILES = 7;

        this.inputEl = input;
        this.suggestionEl = suggestion
        this.template = document.querySelector('#js-suggestion-template');
        this.header = document.querySelector('.js-header');

        this._setListeners();
        this._initVue();
    }

    _setListeners() {
        this.inputEl.addEventListener('input', window.debounce(({ target }) => {
            if (target.value.length > 2) {
                this._updateData();
                this.app.query = target.value
            } else {
                this.app.$emit('close-suggestion');
            }

        }, 250));

        this.header && this.header.addEventListener('click', ({ target }) => {
            if (this.inputEl !== target) {
                this.app.$emit('close-suggestion');
            }
        });
    }

    _initVue() {
        this.app = new Vue({
            el: this.suggestionEl,
            template: this.template,
            delimiters: ['<%', '%>'], // {{ vars }} - используется в panini
            data: function () {
                return {
                    query: '',
                    isOpen: false,
                    suggestion: {}
                }
            },
            created() {
                this.$on('close-suggestion', () => {
                    this.isOpen = false;
                })

                this.$on('open-suggestion', () => {
                    this.isOpen = true;
                })
            },
            methods: {
                productArrayToObject(array) {
                    return array.map(item => {
                        return {
                            name: item[1],
                            link: item[2],
                            desc: item[3],
                            price: item[4],
                            currency: item[6],
                            pack: item[8],
                            company: item[9],
                        }
                    });
                },
                plural(count, words) {
                    const cases = [2, 0, 1, 1, 1, 2];
                    return count + ' ' + words[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
                },
                pluralProduct(count) {
                    const words = ['товар', 'товара', 'товаров'];
                    return this.plural(count, words);
                },
                pluralResult(count) {
                    const words = ['результат', 'результата', 'результатов'];
                    return this.plural(count, words);
                },
                getHrefByTypeName(name) {
                    return `/${name}/?search=${this.query}`
                }
            },
            computed: {
                productMore() {
                    return this.suggestion.products.count - this.suggestion.products.items.length;
                }
            },
            filters: {
                rusType: function (value) {
                    const dictionary = {
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
        });
    }

    _queryMock() {
        return Math.floor(Math.random() * Math.floor(this.MAX_FILES));
    }

    _updateData() {
        fetch(`json/ajax/${this._queryMock()}.json`)
            .then(response => response.json())
            .then(data => {
                this.app.suggestion = this._checkData(data);
                this.app.$emit('open-suggestion');
            });
    }

    _checkData(data) {
        let itemCount = 0;

        Object.keys(data).forEach((prop) => {
            itemCount += data[prop].items.length;
        });

        return itemCount ? data : [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.js-suggestion-input');
    const suggestion = document.querySelector('.js-suggestion');

    new Suggestion({ input, suggestion });
});

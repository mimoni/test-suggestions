import gulp from 'gulp';
import foreach from 'gulp-foreach';
import concat from 'gulp-concat';
import sort from 'gulp-sort';
import babel from 'gulp-babel';
import sass from 'gulp-sass';
import prefix from 'gulp-autoprefixer';
import cssmin from 'gulp-clean-css';
import jsmin from 'gulp-uglify';
import gulpif from 'gulp-if';
import stylelint from 'gulp-stylelint';
import panini from 'panini';
import sync from 'browser-sync';
import postcss from 'gulp-postcss';
import fs from 'fs';
import postscss from 'postcss-scss';
import reporter from 'postcss-reporter';
import scsslint from 'stylelint';
import del from 'del';

const isProduction = process.argv.includes('--production');

const clean = fn => {
    del('build/**/*')
        .then(() => {
            fn();
        });
};

const html = fn => gulp.src('src/*.html')
    .pipe(panini({
        root: 'src/',
        layouts: 'src/layouts/',
        partials: 'src/include/',
        helpers: 'src/hbs-helpers/',
        data: 'src/json/',
    }))
    .pipe(gulp.dest('build/'))
    .on('end', fn);

const paniniRefresh = fn => {
    panini.refresh();
    fn();
};

const htmlPages = fn => {
    const array = [];

    return gulp.src('src/*.html')
        .pipe(foreach((stream, file) => {
            const data = fs.readFileSync(file.path, 'utf-8');

            if (!file.path.includes('_pages.html')) {
                let title = '';
                let isReady = false;

                if (data.split('---').length > 2) {
                    data.split('---')
                        .slice(1)[0].split('\n')
                        .forEach(line => {
                            // eslint-disable-next-line lodash/prefer-startswith
                            if (line.indexOf('title: ') === 0) {
                                title = line.replace('title: ', '')
                                    .replace('\r', '');
                            }
                            // eslint-disable-next-line lodash/prefer-startswith
                            if (line.indexOf('isReady: ') === 0) {
                                isReady = line.replace('isReady: ', '')
                                    .replace('\r', '') === 'true';
                            }
                        });
                }

                if (file.path.includes('/')) {
                    array.push({
                        file: file.path.slice(file.path.lastIndexOf('/') + 1),
                        title,
                        isReady,
                    });
                } else {
                    array.push({
                        file: file.path.slice(file.path.lastIndexOf('\\') + 1),
                        title,
                        isReady,
                    });
                }
            }

            return stream;
        }))
        .on('end', () => {
            fs.writeFileSync('src/json/_pages.json', JSON.stringify(array, null, '    ') + '\n');
            fn();
        });
};

const json = fn => gulp.src('src/json/**/*.*')
    .pipe(gulp.dest('build/json/'))
    .on('end', fn);

const css = fn => gulp.src('src/include/**/*.scss')
    .pipe(stylelint({
        reporters: [
            {
                formatter: 'string',
                console: true,
            },
        ],
    }))
    .pipe(sort())
    .pipe(concat('main.css'))
    .pipe(sass({
        errLogToConsole: true,
    })
        .on('error', sass.logError))
    .pipe(prefix({
        cascade: false,
        remove: true,
    }))
    .pipe(gulpif(isProduction, cssmin()))
    .pipe(gulp.dest('build/css/'))
    .on('end', fn);


const jslibs = fn => gulp.src('src/include/_libsjs/**/*.js')
    .pipe(concat('libs.js'))
    .pipe(gulpif(isProduction, jsmin()))
    .pipe(gulp.dest('build/js/'))
    .on('end', fn);

const js = fn => gulp.src(['src/include/**/*.js', '!src/include/_libsjs/**/*.js'])
    .pipe(concat('main.js'))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(gulpif(isProduction, jsmin()))
    .pipe(gulp.dest('build/js/'))
    .on('end', fn);

const assets = fn => gulp.src('src/assets/**/*.*')
    .pipe(gulp.dest('build/assets/'))
    .on('end', fn);

const reload = fn => {
    if (process.env.NODE_ENV === 'sync' || !process.env.NODE_ENV) {
        sync.reload();
    }

    fn();
};

gulp.task('test-scss', fn => {
    // https://maximgatilin.github.io/stylelint-config/
    const processors = [
        scsslint({
            rules: {
                indentation: 'tab',
                'string-quotes': 'single',
                'color-hex-case': 'lower',
                'color-hex-length': 'short',
                'color-named': 'never',
                'color-no-hex': true,
                'selector-no-id': true,
                'selector-combinator-space-after': 'always',
                'selector-attribute-operator-space-before': 'never',
                'selector-attribute-operator-space-after': 'never',
                'selector-attribute-brackets-space-inside': 'never',
                'declaration-block-trailing-semicolon': 'always',
                'declaration-colon-space-before': 'never',
                'declaration-colon-space-after': 'always',
                'number-leading-zero': 'always',
                'font-weight-notation': 'numeric',
                'font-family-name-quotes': 'always-where-recommended',
                'rule-empty-line-before': 'always-multi-line',
                'selector-pseudo-element-colon-notation': 'double',
                'selector-pseudo-class-parentheses-space-inside': 'never',
                'media-feature-range-operator-space-before': 'always',
                'media-feature-range-operator-space-after': 'always',
                'media-feature-parentheses-space-inside': 'never',
                'media-feature-colon-space-before': 'never',
                'media-feature-colon-space-after': 'always',
            },
        }),
        reporter({
            clearMessages: true,
            throwError: false,
        }),
    ];

    return gulp.src(['src/scss/**/*.@(*(s)css)', '!src/scss/main.scss'])
        .pipe(postcss(processors, { syntax: postscss }))
        .on('end', fn);
});

gulp.task('build', gulp.series(clean, css, gulp.parallel(htmlPages, jslibs, js, assets), gulp.parallel(html, json)));

gulp.task('watch', fn => {
    const options = { usePolling: true };

    gulp.watch(['src/*.html'], options,
        gulp.series(htmlPages, reload));

    gulp.watch(['src/*.html', 'src/{layouts,include}/**/*.html', 'src/js/hbs-helpers/**/*.js', 'src/json/**/*.*', '!src/json/_pages.json'], options,
        gulp.series(paniniRefresh, html, reload));

    gulp.watch(['src/json/**/*.*', '!src/json/_pages.json'], options,
        gulp.series(json, reload));

    gulp.watch(['src/include/**/*.scss'], options,
        gulp.series(css, reload));

    gulp.watch(['src/include/_libsjs/**/*.js'], options,
        gulp.series(jslibs, reload));

    gulp.watch(['src/include/**/*.js', '!src/include/_libsjs/**/*.js'], options,
        gulp.series(js, reload));

    gulp.watch(['src/assets/**/*.*'], options,
        gulp.series(assets, reload));

    fn();
});

gulp.task('default', gulp.series('build', 'watch'));

gulp.task('default-sync', gulp.series('build', 'watch', () => {
    sync({
        server: {
            baseDir: 'build',
            index: '_pages.html',
            middleware: (request, response, next) => {
                if (/\.json|\.txt|\.html/.test(request.url) && request.method.toUpperCase() === 'POST') {
                    request.method = 'GET';
                }
                next();
            },
        },
        tunnel: false,
        host: 'localhost',
        logPrefix: '',
    });
}));

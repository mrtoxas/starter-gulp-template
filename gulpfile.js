const { src, dest, watch, series, parallel } = require('gulp'),
  stripCssComments = require('gulp-strip-css-comments'),
  browserSync = require('browser-sync').create(),
  sass = require('gulp-sass')(require('sass')),
  fileinclude = require('gulp-file-include'),
  uglify = require('gulp-uglify-es').default,
  sourcemaps = require('gulp-sourcemaps'),
  source = require('vinyl-source-stream'),
  browserify = require('browserify'),
  changed = require('gulp-changed'),
  cssnano = require('gulp-cssnano'),
  plumber = require('gulp-plumber'),
  buffer = require('vinyl-buffer'),
  rename = require('gulp-rename'),
  babelify = require('babelify'),
  del = require('del');

const paths = {
  input: './src/',
  output: './dist/',
  styles: {
    input: './src/styles/',
    output: './dist/styles/',
  },
  scripts: {
    input: './src/scripts/',
    files: [
      'main.js',
    ],
    output: './dist/scripts/',
  },
  html: {
    input: './src/',
    output: './dist/',
  },
  plugins: {
    input: './src/plugins/**/*.*',
    output: './dist/plugins/',
  },
  staticFiles: './src/assets/**/*.*',
};

const browserSyncServe = (cb) => {
  browserSync.init({
    server: {
      index: 'index.html',
      baseDir: './dist',
    },
  });
  cb();
};

const browserSyncReload = (cb) => {
  browserSync.reload();
  cb();
};

const styles = (cb) => {
  src(paths.styles.input + '**/*.scss')
    //.pipe(sourcemaps.init())
    .pipe(changed(paths.styles.output))
    .pipe(plumber())
    .pipe(sass({
      includePaths: [`node_modules`],
    }).on('error', sass.logError))
    .pipe(stripCssComments())
    .pipe(cssnano())
    .pipe(rename({ extname: '.css', suffix: '.min' }))
    //.pipe(sourcemaps.write())
    .pipe(dest(paths.styles.output));
  cb();
}

const scripts = (cb) => {
  paths.scripts.files.map(function(entry) {
    return browserify({
      entries: [paths.scripts.input + entry],
    })
      .transform(babelify, { presets: ['@babel/preset-env'] })
      .bundle()
      .pipe(source(entry))
      .pipe(rename({
        extname: '.min.js',
      }))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(dest(paths.scripts.output));
  });
  cb();
};

const html = (cb) => {
  src(paths.html.input + '*.html')
    .pipe(fileinclude({ prefix: '@@' }))
    .pipe(dest(paths.html.output));
  cb();
}

const assets = (cb) => {
  src(paths.staticFiles).pipe(dest(paths.output));
  src(paths.plugins.input).pipe(dest(paths.plugins.output));
  cb();
};

const watched = (cb) => {
  watch(`${paths.styles.input}**/*.+(css|scss)`, series(styles, browserSyncReload));
  watch(`${paths.scripts.input}**/*.js`, series(scripts, browserSyncReload));
  watch(`${paths.html.input}**/*.html`, series(html, browserSyncReload));
  cb();
};

const clean = (cb) => {
  del.sync(paths.output);
  cb();
};

exports.styles = styles;
exports.scripts = scripts;
exports.html = html;
exports.watched = watched;
exports.clean = clean;
exports.assets = assets;

exports.default = series(clean, assets, parallel(scripts, styles, html), browserSyncServe, watched);


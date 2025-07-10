var gulp = require('gulp');
var PluginError = require('plugin-error');
var fancyLog = require('fancy-log');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var webserver = require('gulp-webserver');
var pug = require('gulp-pug');
var data = require('gulp-data');
var mergeJson = require('gulp-merge-json');
var stylus = require('gulp-stylus');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cleanCSS = require('gulp-clean-css');
var deploy = require('gulp-gh-pages');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var inline = require('gulp-inline-source');
var tap = require('gulp-tap');
var rename = require('gulp-rename');

var utils = require('./data/utils.js');



function bundle() {
  var bundler = watchify(browserify('./src/index.js', watchify.args));
  bundler.on('update', bundle); // on any dep update, runs the bundler
  return bundler.bundle()
    // log errors if they happen
    .on('error', function(err) { fancyLog('Browserify Error', err); this.emit('end'); })
    .pipe(source('app.js'))
    // optional, remove if you dont want sourcemaps
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./build'));
}

function bundleProd() {
  var bundler = browserify('./src/index.js');
  return bundler.bundle()
    // log errors if they happen
    .on('error', function(err) { fancyLog('Browserify Error', err); this.emit('end'); })
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./build'));
}

function cleanJson() {
  return gulp.src('build/data/index.json', {read: false, allowEmpty: true})
    .pipe(clean());
}


function buildMoviesJson() {
  return gulp.src('./data/movies/**/*.json')
    .pipe(mergeJson({
      fileName: 'index.json',
      edit: function(parsedJson, file) {
        // Use filename (without extension) as key to avoid flattening
        const path = require('path');
        const key = path.basename(file.path, path.extname(file.path));
        let obj = {};
        obj[key] = parsedJson;
        return obj;
      },
      transform: function(merged) {
        // merged is an object with keys as filenames, values as movie objects
        return Object.values(merged);
      }
    }))
    .pipe(gulp.dest('./build/data/movies'));
}

function buildActorsJson() {
  return gulp.src('./data/actors/**/*.json')
    .pipe(mergeJson({
      fileName: 'index.json',
      edit: function (parsedJson, file) {
        var output = {};
        output[parsedJson.name] = parsedJson;
        return output;
      }
    }))
    .pipe(gulp.dest('./build/data/actors'));
}

function buildJson() {
  return gulp.src(['./build/data/actors/index.json', './build/data/movies/index.json'])
    .pipe(mergeJson({
      fileName: 'index.json',
      edit: function (parsedJson, file) {
        // actors file: { ActorName: { ... } }, movies file: [ { ... }, ... ]
        if (Array.isArray(parsedJson)) {
          return { movies: parsedJson };
        } else {
          return { actors: parsedJson };
        }
      },
      transform: function (merged) {
        // flatten to { actors: {...}, movies: [...] }
        if (Array.isArray(merged)) {
          return Object.assign({}, ...merged);
        } else {
          return merged;
        }
      }
    }))
    .pipe(gulp.dest('./build/data'));
}

async function buildStatic() {
  const gulpImagemin = (await import('gulp-imagemin')).default;
  return gulp.src([
      './assets/images/**/*',
      './assets/favicon.ico',
      './assets/CNAME',
      '_redirects'
    ])
    .pipe(gulpImagemin())
    .pipe(gulp.dest('build/'));
}

function buildStylus() {
  return gulp.src('./assets/app.styl')
    .pipe(stylus({
      url: { name: 'url', limit: false }
    }))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(cleanCSS())
    .pipe(gulp.dest('build'));
}

const fs = require('fs');
function buildPug() {
  return gulp.src('./src/views/templates/index.pug')
    .pipe(data(function() {
      const json = JSON.parse(fs.readFileSync('./build/data/index.json', 'utf8'));
      return { actorsAndMovies: json, utils: utils };
    }))
    .pipe(pug())
    .pipe(gulp.dest('./build'));
}

function buildCsv() {
  return gulp.src('./build/data/index.json')
    .pipe(tap(function(file) {
      var movieList = JSON.parse(file.contents.toString());
      movieList = utils.toSortedMovieList(movieList);
      file.contents = new Buffer(utils.movieListToCsv(movieList), 'utf8');
    }))
    .pipe(rename({
      basename: 'movies',
      extname: '.csv'
    }))
    .pipe(gulp.dest('./build'));
}

function inlineSource() {
  return gulp.src('./build/*.html')
    .pipe(inline())
    .pipe(gulp.dest('./build'));
}

gulp.task('webserver', function() {

  var stylWatcher = gulp.watch('assets/**/*.styl', gulp.series('build-stylus'));
  var imageWatcher = gulp.watch('assets/**/*', gulp.series('build-static'));
  var pugWatcher = gulp.watch('src/views/templates/**/*.pug', gulp.series('build-templates'));
  var jsonWatcher = gulp.watch('data/**/*.json', gulp.series('build-templates', 'build-csv'));

  gulp.src('build')
    .pipe(webserver({
      port: 3456,
      livereload: false,
      host: '0.0.0.0',
      directoryListing: false,
      open: false
    }));
});

gulp.task('clean:json', function() {
  return cleanJson();
});

gulp.task('build-actors-json', function() {
  return buildActorsJson();
});

gulp.task('build-movies-json', function() {
  return buildMoviesJson();
});

gulp.task('build-json', gulp.series('build-movies-json', 'build-actors-json', 'clean:json', buildJson));
gulp.task('build-js', gulp.series('build-json', bundle)); // so you can run `gulp js` to build the file

gulp.task('build-static', function() {
  // Support async buildStatic for ESM gulp-imagemin
  return buildStatic();
});

gulp.task('build-templates', gulp.series('build-json', buildPug));

gulp.task('build-stylus', gulp.series('build-static', buildStylus));

gulp.task('build-csv', gulp.series('build-json', buildCsv));

gulp.task('default', gulp.series('build-stylus', 'build-js', 'build-templates', 'build-csv', 'webserver'));

gulp.task('build-dev', gulp.series('build-stylus', 'build-templates', bundle));


gulp.task('do-build', gulp.series('build-stylus', 'build-static', 'build-json', 'build-templates', 'build-csv', bundleProd));

gulp.task('build', gulp.series('do-build', inlineSource));

gulp.task('deploy', function () {
  return gulp.src([
      "./build/**/*",
      "!./build/app.js",
      "!./build/app.css",
      "!./build/data/**/*",
      "!./build/*.svg"
    ])
    .pipe(deploy({
      cacheDir: './tmp'
    }));
});

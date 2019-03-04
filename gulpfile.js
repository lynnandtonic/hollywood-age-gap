var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var webserver = require('gulp-webserver');
var pug = require('gulp-pug');
var data = require('gulp-data');
var concatJson = require('gulp-concat-json');
var mergeJson = require('gulp-merge-json');
var stylus = require('gulp-stylus');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var deploy = require('gulp-gh-pages');
var uglify = require('gulp-uglify');
var assignToPug = require('gulp-assign-to-pug');
var clean = require('gulp-clean');
var imagemin = require('gulp-imagemin');
var inline = require('gulp-inline-source');
var tap = require('gulp-tap');
var rename = require('gulp-rename');

var utils = require('./data/utils.js');

gulp.task('build-js', ['build-json'], bundle); // so you can run `gulp js` to build the file

function bundle() {
  var bundler = watchify(browserify('./src/index.js', watchify.args));
  bundler.on('update', bundle); // on any dep update, runs the bundler
  return bundler.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
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
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./build'));
}

function cleanJson() {
  return gulp.src('build/data/index.json', {read: false})
    .pipe(clean());
}

function buildMoviesJson() {
  return gulp.src('./data/movies/**/*.json')
    .pipe(concatJson('index.json'))
    .pipe(gulp.dest('./build/data/movies'));
}

function buildActorsJson() {
  return gulp.src('./data/actors/**/*.json')
    .pipe(mergeJson('index.json', function (parsedJson, file) {
      var output = {};
      output[parsedJson.name] = parsedJson;
      return output;
    }))
    .pipe(gulp.dest('./build/data/actors'));
}

function buildJson() {
  return gulp.src('./build/data/**/*.json')
    .pipe(mergeJson('index.json', function (parsedJson, file) {
      var output = {};
      if (parsedJson.push) {
        output.movies = parsedJson;
      } else {
        output.actors = parsedJson;
      }
      return output;
    }))
    .pipe(gulp.dest('./build/data'));
}

function buildStatic() {
  return gulp.src([
      './assets/images/**/*',
      './assets/favicon.ico',
      './assets/CNAME',
      '_redirects'
    ])
    .pipe(imagemin())
    .pipe(gulp.dest('build/'));
}

function buildStylus() {
  return gulp.src('./assets/app.styl')
    .pipe(stylus({
      url: { name: 'url', limit: false }
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(minifyCSS())
    .pipe(gulp.dest('build'));
}

function buildPug() {
  return gulp.src('./build/data/index.json')
    .pipe(data(function() {
      return {utils: utils};
    }))
    .pipe(assignToPug('./src/views/templates/index.pug', {
      varName: 'actorsAndMovies'
    }))
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

  var stylWatcher = gulp.watch('assets/**/*.styl', ['build-stylus']);
  var imageWatcher = gulp.watch('assets/**/*', ['build-static']);
  var pugWatcher = gulp.watch('src/views/templates/**/*.pug', ['build-templates']);
  var jsonWatcher = gulp.watch('data/**/*.json', ['build-templates', 'build-csv']);

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

gulp.task('build-json', ['build-movies-json', 'build-actors-json', 'clean:json'], function() {
  return buildJson();
});

gulp.task('build-static', function() {
  return buildStatic();
});

gulp.task('build-templates', ['build-json'], function() {
  return buildPug();
});

gulp.task('build-stylus', ['build-static'], function() {
  return buildStylus();
});

gulp.task('build-csv', ['build-json'], function() {
  return buildCsv();
});

gulp.task('default', ['build-stylus', 'build-js', 'build-templates', 'build-csv', 'webserver']);

gulp.task('build-dev', ['build-stylus', 'build-templates'], function() {
  bundle();
});

gulp.task('build', ['do-build'], function() {
  inlineSource();
});

gulp.task('do-build', ['build-stylus', 'build-static', 'build-json', 'build-templates', 'build-csv'], function() {
  return bundleProd();
});

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

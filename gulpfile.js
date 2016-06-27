var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var webserver = require('gulp-webserver');
var jade = require('gulp-jade');
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

gulp.task('build-js', ['build-json'], bundle); // so you can run `gulp js` to build the file

function bundle() {
  var bundler = watchify(browserify('./src/App.js', watchify.args));
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
  var bundler = browserify('./src/App.js');
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
  return gulp.src('./assets/**/*')
    .pipe(gulp.dest('build'));
}

function buildStylus() {
  return gulp.src('./assets/app.styl')
    .pipe(stylus())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(minifyCSS())
    .pipe(gulp.dest('build'));
}

function buildJade() {
  return gulp.src('./build/data/index.json')
    .pipe(assignToPug('./src/views/templates/index.jade', {
      varName: 'actorsAndMovies'
    }))
    .pipe(gulp.dest('./build'));
}

gulp.task('webserver', function() {

  var stylWatcher = gulp.watch('assets/**/*.styl', ['build-stylus']);
  var imageWatcher = gulp.watch('assets/**/*', ['build-static']);
  var jadeWatcher = gulp.watch('src/views/templates/**/*.jade', ['build-templates']);
  var jsonWatcher = gulp.watch('data/**/*.json', ['build-templates']);

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
  return buildJade();
});

gulp.task('build-stylus', function () {
  return buildStylus();
});

gulp.task('default', ['build-stylus', 'build-static', 'build-js', 'build-templates', 'webserver']);

gulp.task('build-dev', ['build-stylus', 'build-static', 'build-templates'], function() {
  bundle();
});

gulp.task('build', ['build-stylus', 'build-static', 'build-json', 'build-templates'], function() {
  bundleProd();
});

gulp.task('deploy', ['build'], function () {
  return gulp.src("./build/**/*")
    .pipe(deploy({
      cacheDir: './tmp'
    }));
});

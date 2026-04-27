var gulp = require('gulp');
var fancyLog = require('fancy-log');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { optimize } = require('svgo');
const postcssPlugin = require('postcss');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var browserSync = require('browser-sync').create();
var pug = require('gulp-pug');
var data = require('gulp-data');
var mergeJson = require('gulp-merge-json');
var stylus = require('stylus');
var autoprefixer = require('autoprefixer');
var cleanCSS = require('gulp-clean-css');
var ghpages = require('gh-pages');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var inline = require('gulp-inline-source');
var tap = require('gulp-tap');
var rename = require('gulp-rename');
var sharp = require('sharp');

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

async function buildStaticSvg() {
  const svgPattern = './assets/images/**/*.svg';

  const files = glob.sync(svgPattern);

  // Ensure build/images directory exists
  if (!fs.existsSync('build/images')) {
    fs.mkdirSync('build/images', { recursive: true });
  }

  for (const filePath of files) {
    const outputPath = path.join('build/images', path.basename(filePath));
    const svgContent = fs.readFileSync(filePath, 'utf8');

    try {
      const result = optimize(svgContent, {
        path: filePath,
        multipass: true
      });
      fs.writeFileSync(outputPath, result.data);
      fancyLog('Optimized SVG:', path.basename(filePath));
    } catch (err) {
      fancyLog('SVGO Error processing', filePath, '-', err.message, '- copying original');
      fs.copyFileSync(filePath, outputPath);
    }
  }
}

async function buildStaticImages() {
  const imagePattern = './assets/images/**/*.{png,jpg,jpeg}';

  const files = glob.sync(imagePattern);

  // Ensure build/images directory exists
  if (!fs.existsSync('build/images')) {
    fs.mkdirSync('build/images', { recursive: true });
  }

  for (const filePath of files) {
    const outputPath = path.join('build/images', path.basename(filePath));
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.png') {
        await sharp(filePath)
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(outputPath);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(filePath)
          .jpeg({ quality: 80 })
          .toFile(outputPath);
      }
      fancyLog('Optimized:', path.basename(filePath));
    } catch (err) {
      fancyLog('Sharp Error processing', filePath, '-', err.message, '- copying original');
      // If Sharp fails, just copy the original file
      fs.copyFileSync(filePath, outputPath);
    }
  }
}

function buildStaticOther() {
  return gulp.src([
      './assets/favicon.ico',
      './assets/CNAME',
      '_redirects'
    ])
    .pipe(gulp.dest('build/'));
}

const buildStatic = gulp.parallel(buildStaticSvg, buildStaticImages, buildStaticOther);

function buildStylus(done) {
  const inputFile = './assets/app.styl';
  const outputFile = './build/app.css';

  // Read the Stylus file
  const stylusContent = fs.readFileSync(inputFile, 'utf8');

  // Compile Stylus to CSS
  stylus(stylusContent)
    .set('filename', inputFile)
    .set('paths', [path.dirname(inputFile)])
    .define('url', stylus.url({ limit: false }))
    .render((err, css) => {
      if (err) {
        fancyLog('Stylus Error', err);
        done(err);
        return;
      }

      // Process with PostCSS (autoprefixer)
      postcssPlugin([autoprefixer()])
        .process(css, { from: undefined })
        .then(result => {
          // Write to build directory
          fs.writeFileSync(outputFile, result.css);
          fancyLog('Stylus compiled successfully');

          // Now minify with cleanCSS
          return gulp.src(outputFile)
            .pipe(cleanCSS())
            .pipe(gulp.dest('build'))
            .on('end', done);
        })
        .catch(err => {
          fancyLog('PostCSS Error', err);
          done(err);
        });
    });
}

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
      file.contents = Buffer.from(utils.movieListToCsv(movieList), 'utf8');
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

gulp.task('webserver', function(done) {
  browserSync.init({
    server: {
      baseDir: './build'
    },
    port: 3456,
    host: '0.0.0.0',
    open: false,
    notify: false
  });

  gulp.watch('assets/**/*.styl', gulp.series('build-stylus')).on('change', browserSync.reload);
  gulp.watch('assets/**/*', gulp.series('build-static')).on('change', browserSync.reload);
  gulp.watch('src/views/templates/**/*.pug', gulp.series('build-templates')).on('change', browserSync.reload);
  gulp.watch('data/**/*.json', gulp.series('build-templates', 'build-csv')).on('change', browserSync.reload);

  done();
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

gulp.task('build-static', buildStatic);

gulp.task('build-templates', gulp.series('build-json', buildPug));

gulp.task('build-stylus', gulp.series('build-static', buildStylus));

gulp.task('build-csv', gulp.series('build-json', buildCsv));

gulp.task('default', gulp.series('build-stylus', 'build-js', 'build-templates', 'build-csv', 'webserver'));

gulp.task('build-dev', gulp.series('build-stylus', 'build-templates', bundle));


gulp.task('do-build', gulp.series('build-stylus', 'build-static', 'build-json', 'build-templates', 'build-csv', bundleProd));

gulp.task('build', gulp.series('do-build', inlineSource));

gulp.task('deploy', function (done) {
  ghpages.publish('build', {
    src: [
      '**/*',
      '!app.js',
      '!app.css',
      '!data/**/*',
      '!*.svg'
    ],
    dotfiles: true
  }, function(err) {
    if (err) {
      fancyLog('Deploy Error', err);
      done(err);
    } else {
      fancyLog('Successfully deployed to GitHub Pages');
      done();
    }
  });
});

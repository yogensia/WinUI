// Gulp.js configuration.
'use strict'

const
  // Gulp and plugins.
  gulp         = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  cleanCSS     = require('gulp-clean-css'),
  concat       = require('gulp-concat'),
  fancyLog     = require('fancy-log'),
  htmlmin      = require('gulp-htmlmin'),
  imagemin     = require('gulp-imagemin'),
  newer        = require('gulp-newer'),
  sass         = require('gulp-sass'),
  sourcemaps   = require('gulp-sourcemaps'),
  uglify       = require('gulp-uglify'),
  gutil        = require('gulp-util'),
  browsersync  = require('browser-sync'),
  ftp          = require('vinyl-ftp'),

  // Credentials.
  ftpConfig = require('./ftp-config.json'),

  // Source and build folders.
  dir = {
    src  : 'src/',
    build: 'public/',
    cache: 'src/cache/'
  }


// -------------------------------------------------------------------


// Markup settings.
const markup = {
  src  : dir.src + '*.html',
  build: dir.build
}

const compileMarkup = () => {
  return gulp
    .src(markup.src)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(markup.build))
}

const watchMarkup = () => {
  let watch = gulp.watch(markup.src)
  watch.on('all', () => {
    compileMarkup()
      .pipe(browsersync.reload({ stream: true }))
  })
}


// -------------------------------------------------------------------


// SASS settings.
const styleSASS = {
  src  : dir.src + 'sass/*.scss',
  build: dir.cache
}

const compileSASS = () => {
  return gulp
    .src(styleSASS.src)
    .pipe(sass({
      indentType: 'tab',
      indentWidth: 1,
      outputStyle: 'expanded', // Expanded so that our CSS is readable
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(styleSASS.build))
}

const watchSASS = () => {
  let watch = gulp.watch(styleSASS.src)
  watch.on('all', () => {
    compileSASS()
  })
}


// -------------------------------------------------------------------


// CSS settings.
const styleCSS = {
  src: [
    dir.src   + 'css/vendor/normalize.css',
    dir.cache + '/main.css'
  ],
  build: dir.build + 'css/'
}

const compileCSS = () => {
  return gulp
    //.src('src/**/*.css')
    .src(styleCSS.src)
    //.pipe(sourcemaps.init())
    .pipe(concat('bundle.css'))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(styleCSS.build))
}

const watchCSS = () => {
  let watch = gulp.watch(styleCSS.src)
  watch.on('all', () => {
    compileCSS()
      .pipe(browsersync.reload({ stream: true }))
  })
}


// -------------------------------------------------------------------


// SASS settings.
const img = {
  src: [
    dir.src + '**/*.gif',
    dir.src + '**/*.jpg',
    dir.src + '**/*.jpeg',
    dir.src + '**/*.png',
    dir.src + '**/*.svg'
  ],
  build: dir.build
}

const compileImage = () => {
  return gulp
    .src(img.src)
    .pipe(newer(img.build))
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(gulp.dest(img.build))
}

const watchImage = () => {
  let watch = gulp.watch(img.src)
  watch.on('all', () => {
    compileImage()
    browsersync ? browsersync.reload : {}
  })
}


// -------------------------------------------------------------------


// JavaScript settings.
const js = {
  src: [
    dir.src + 'js/vendor/jquery.js',
    dir.src + 'js/vendor/jquery.ba-throttle-debounce.js',
    dir.src + 'js/app.js'
  ],
  build   : dir.build + 'js/',
  filename: 'bundle.js'
}

const compileScript = () => {
  return gulp
    .src(js.src)
    //.pipe(sourcemaps.init())
    .pipe(concat(js.filename))
    .pipe(uglify())
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest(js.build))
}

const watchScript = () => {
  let watch = gulp.watch(js.src)
  watch.on('all', () => {
    compileScript()
      .pipe(browsersync.reload({ stream: true }))
  })
}


// -------------------------------------------------------------------


// Start BrowserSync server.
const startServer = () => {
  browsersync({
    browser: 'C:\\Users\\Yogensia\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe',
    server: {
      baseDir: 'public',
    },
  })
}


// -------------------------------------------------------------------


// Deploy to FTP.
const deploy = () => {
  const conn = ftp.create({
    host    : ftpConfig.host,
    port    : ftpConfig.port,
    user    : ftpConfig.user,
    password: ftpConfig.pw,
    parallel: 10,
    log     : fancyLog.log
  })

  const globs = [
    dir.build + '**'
  ]

  return gulp
    .src( globs, { base: 'public', buffer: false } )
    .pipe( conn.newer( ftpConfig.path ) ) // only upload newer files.
    .pipe( conn.dest( ftpConfig.path ) )
}


// -------------------------------------------------------------------


const compile = gulp.parallel(compileMarkup, gulp.series(compileSASS, compileCSS), compileImage, compileScript)
compile.description = 'Compile all sources.'

const serve = gulp.series(compile, startServer)
serve.description = 'Serve compiled source on local server.'

const watch = gulp.parallel(watchMarkup, watchSASS, watchCSS, watchImage, watchScript)
watch.description = 'Watch for changes to all source.'

const defaultTask = gulp.parallel(serve, watch)
defaultTask.description = 'Serve & watch for changes to all source.'


// -------------------------------------------------------------------


module.exports = {
  // compileMarkup,
  // compileSASS,
  // compileCSS,
  // compileImage,
  // compileScript,
  // watchMarkup,
  // watchSASS,
  // watchCSS,
  // watchImage,
  // watchScript,
  deploy,
  compile,
  serve,
  watch,
  default: defaultTask
}

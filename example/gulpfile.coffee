gulp = require('gulp')
coffee = require('gulp-coffee')
sourcemaps = require('gulp-sourcemaps')
stitch = require('./../src')
gulpAddSrc = require('gulp-add-src');

packages = [
  'common',
  'lib/a',
  'lib/b'
]
gulp.task 'default', ->
    gulp.src(['common/**/*.coffee', 'lib/**/*.coffee'])
        .pipe(sourcemaps.init())
        .pipe(coffee({bare: true}))
        .pipe(gulpAddSrc(['common/**/*.js', 'lib/**/*.js']))
        .pipe(stitch('bundle.js', packages))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('.'))


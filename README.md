# Gulp stitch plugin with sourcemap support

It allows you to use CommonJS modules in browser bundled in one file. Supports sourcemaps.

Actual implementation of Stitch object is borrowed from https://github.com/sstephenson/stitch.
Inspired by https://github.com/thrillerwu/gulp-stitch.

## Params

stitch(file, packages);

<table>
<tr>
<td>file</td>
<td>String</td>
<td>Destination file name</td>
</tr>
<tr>
<td>packanges</td>
<td>Array</td>
<td>string array of package paths related to the directory from where you start your gulp task</td>
</tr>
</table>

## Usage

```js
var stitch = require('gulp-stitch-sourcemap');
var sourcemap = require('gulp-sourcemaps');
var coffee = require('gulp-coffee');

gulp.task('stitch', function() {
  return gulp.src('./app/**/*.js', './vendor/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true})
    .pipe(stitch('bundle.js', ['lib', 'vendor']))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/'));
});
```

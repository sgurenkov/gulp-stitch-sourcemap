var should = require('should');
var stitch = require('../index');
var gulp = require('gulp');
var path = require('path');

var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); }
var packages = ['fixtures'];
var bundle = 'bundle.js';

describe('gulp-stitch-sourcemap', function () {
  it('should throw when packages is missing', function () {
    (function () {
      stitch();
    }).should.throw('Missing packages option for gulp-stitch-sourcemap');
  });

  it('should emit error on streamed file', function (done) {
    gulp.src(fixtures('*'), { buffer: false })
      .pipe(stitch(bundle, packages))
      .on('error', function (err) {
        err.message.should.eql('Streams not supported');
        done();
      });
  });

});
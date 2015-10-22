var should = require('should');
var stitch = require('../index');
var gulp = require('gulp');
var testStream = require('./test-stream');
var assert = require('stream-assert');
var SourceMapConsumer = require('source-map').SourceMapConsumer
var packages = ['test/fixtures'];
var bundle = 'bundle.js';

describe('gulp-stitch-sourcemap', function () {
  it('should throw when packages is missing', function () {
    (function () {
      stitch();
    }).should.throw('Missing packages option for gulp-stitch-sourcemap');
  });

  it('should emit error on streamed file', function (done) {
    testStream('hi', 1)
      .pipe(stitch(bundle, packages))
      .on('error', function (err) {
        err.message.should.eql('Streaming not supported');
        done();
      });
  });
  it ('result file should have basename', function (done) {
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch(bundle, packages))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        f.basename.should.eql(bundle)
      }))
      .pipe(assert.end(done));
  });

  it('should stitch files', function (done) {
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch(bundle, packages))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        var arr = f.contents.toString().split("\n");
        arr[2].should.eql("var b = require ('b/b');");
        arr[3].should.eql("b();");
        arr[5].should.eql("module.exports = function () {");
        arr[6].should.eql("  console.log('b');");
      }))
      .pipe(assert.end(done));
  });

  it('should create sourcemap', function (done){
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch(bundle, packages))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        f.sourceMap.sources.should.have.length(2);
        f.sourceMap.file.should.eql(bundle);
      }))
      .pipe(assert.end(done));
  });

  it('sourcemap should be correct', function (done){
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch(bundle, packages))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        var smc = new SourceMapConsumer(f.sourceMap);
        var m = smc.originalPositionFor({line: 3, column: 1});
        m.source.should.eql('a/a.js');
        m.line.should.eql(1);
        m = smc.originalPositionFor({line: 4, column: 1});
        m.source.should.eql('a/a.js');
        m.line.should.eql(2);
        m = smc.originalPositionFor({line: 6, column: 1});
        m.source.should.eql('b/b.js');
        m.line.should.eql(1);
        m = smc.originalPositionFor({line: 7, column: 8});
        m.source.should.eql('b/b.js');
        m.line.should.eql(2);
      }))
      .pipe(assert.end(done));
  });
});
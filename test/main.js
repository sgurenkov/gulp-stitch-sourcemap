var should = require('should');
var stitch = require('../index');
var cache = require('../index').cache;
var gulp = require('gulp');
var testStream = require('./test-stream');
var assert = require('stream-assert');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var packages = ['test/fixtures'];
var bundle = 'bundle.js';
var sourcemaps = require('gulp-sourcemaps');

describe('gulp-stitch-sourcemap', function () {
  it('should throw when output file name option is missing', function () {
    (function () {
      stitch();
    }).should.throw('Missing output (file name) option for gulp-stitch-sourcemap');
  });

  it('should throw when packages option is missing or incorrect type', function () {
    (function () {
      stitch({output: 'test.js', packages: {}});
    }).should.throw('Missing or incorrect type of packages option for gulp-stitch-sourcemap');
  });

  it('should emit error on streamed file', function (done) {
    testStream('hi', {stream: true, ext: '.coffee'})
      .pipe(stitch({output: bundle, packages: packages}))
      .on('error', function (err) {
        err.message.should.eql('Streaming not supported');
        done();
      });
  });

  it ('should compile .coffee files', function (done) {
    testStream('variable = 1', {ext: '.coffee', filename: 'test'})
      .pipe(sourcemaps.init())
      .pipe(stitch({output: bundle, packages: packages}))
      .pipe(assert.first(function (f) {
        f.sourceMap.sources[0].should.eql('test0.coffee');
      }))
      .pipe(assert.end(done));
  });

  it ('should use cache for watch changes', function (done) {
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch({output: bundle, packages: packages, cache: true}))
      .pipe(assert.first(function (f) {
        for (path in cache) {
          (path.indexOf('a.js') > -1 || path.indexOf('b.js') > -1).should.true()
        }
      }))
      .pipe(assert.end(done));

  });

  it ('result file should have basename', function (done) {
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch({output: bundle, packages: packages}))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        f.basename.should.eql(bundle)
      }))
      .pipe(assert.end(done));
  });

  it('should stitch files', function (done) {
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(stitch({output: bundle, packages: packages}))
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
      .pipe(sourcemaps.init())
      .pipe(stitch({output: bundle, packages: packages}))
      .pipe(assert.length(1))
      .pipe(assert.first(function (f) {
        f.sourceMap.sources.should.have.length(2);
        f.sourceMap.file.should.eql(bundle);
      }))
      .pipe(assert.end(done));
  });

  it('sourcemap should be correct', function (done){
    gulp.src(['test/fixtures/**/*.js'])
      .pipe(sourcemaps.init())
      .pipe(stitch({output: bundle, packages: packages}))
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
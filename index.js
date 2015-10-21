var G, PluginError, SourceMapConsumer, SourceMapGenerator, compileSource, escodegen, esprima, extname, generateSourceMap, getRelativePath, gutil, init, join, ref, ref1, through, wrapSources;

through = require('through2');

gutil = require('gulp-util');

ref = require('path'), extname = ref.extname, join = ref.join;

ref1 = require('source-map'), SourceMapConsumer = ref1.SourceMapConsumer, SourceMapGenerator = ref1.SourceMapGenerator;

esprima = require('esprima');

escodegen = require('escodegen');

PluginError = gutil.PluginError;

G = {};

init = function() {
  return G = {
    fileList: {},
    definitions: '',
    packages: null,
    rootPath: process.cwd(),
    lineOffset: 1,
    resultMap: null
  };
};

generateSourceMap = function(file) {
  var ast, astGen;
  ast = esprima.parse(file.contents, {
    loc: true,
    source: file.relative
  });
  astGen = escodegen.generate(ast, {
    sourceMap: true,
    sourceMapWithCode: true,
    file: file.relative
  });
  astGen.map.setSourceContent(file.relative, String(file.contents));
  return JSON.parse(astGen.map.toString());
};

getRelativePath = function(path) {
  var base, i, len, pPath, ref2;
  ref2 = G.packages;
  for (i = 0, len = ref2.length; i < len; i++) {
    pPath = ref2[i];
    base = G.rootPath + '/' + pPath + '/';
    if (path.indexOf(base) === 0) {
      return path.slice(base.length).slice(0, -extname(path).length);
    }
  }
  return '';
};

compileSource = function(file) {
  var exportList, i, len, match, matches, name, orig, source;
  if (file.isStream()) {
    throw new PluginError('gulp-stitch-sourcemap', '');
  }
  name = getRelativePath(file.path);
  source = String(file.contents);
  exportList = [];
  matches = source.match(/exports\.([^ ]*)/ig);
  if (matches) {
    for (i = 0, len = matches.length; i < len; i++) {
      match = matches[i];
      exportList.push(match.replace(/exports\./, ''));
    }
  }
  G.fileList[name] = exportList;
  G.lineOffset++;
  if (file.sourceMap) {
    orig = new SourceMapConsumer(file.sourceMap);
    orig.eachMapping((function(_this) {
      return function(m) {
        return G.resultMap.addMapping({
          generated: {
            line: parseInt(m.generatedLine) + G.lineOffset,
            column: m.generatedColumn
          },
          original: {
            line: m.originalLine,
            column: m.originalColumn
          },
          source: file.sourceMap.sources[0],
          name: m.name
        });
      };
    })(this));
    G.resultMap.setSourceContent(file.sourceMap.sources[0], file.sourceMap.sourcesContent[0]);
  }
  G.lineOffset += source.split('\n').length;
  return ", '" + name + "': function(exports, require, module) {\n" + source + "\n}";
};

wrapSources = function(sources) {
  var exportedName, exportedNames, filePath, i, len, ref2, result;
  result = "(function(/*!Stitch!*/){if (!this.require) { var modules = {}, cache = {}, require = function(name, root) { var path = expand(root, name), module = cache[path], fn; if (module) { return module.exports; } else if (fn = modules[path] || modules[path = expand(path, './index')]) { module = {id: path, exports: {}}; try { cache[path] = module; fn(module.exports, function(name) { return require(name, dirname(path)); }, module); return module.exports; } catch (err) { delete cache[path]; throw err; } } else { throw 'module \\'' + name + '\\' not found'; } }, expand = function(root, name) { var results = [], parts, part; if (/^\\.\\.?(\\/|$)/.test(name)) { parts = [root, name].join('/').split('/'); } else { parts = name.split('/'); } for (var i = 0, length = parts.length; i < length; i++) { part = parts[i]; if (part == '..') { results.pop(); } else if (part != '.' && part != '') { results.push(part); } } return results.join('/'); }, dirname = function(path) { return path.split('/').slice(0, -1).join('/'); }; this.require = function(name) { return require(name, ''); }; this.require.define = function(bundle) { for (var key in bundle) modules[key] = bundle[key];};}";
  result += "var a = {};";
  ref2 = G.fileList;
  for (filePath in ref2) {
    exportedNames = ref2[filePath];
    for (i = 0, len = exportedNames.length; i < len; i++) {
      exportedName = exportedNames[i];
      if (exportedName.match(/^[a-z]+[a-z0-9]*$/i)) {
        result += "a['" + exportedName + "']='" + filePath + "';";
      }
    }
  }
  return result += "this.require.exportsFileMap=a;return this.require.define;}).call(this)({\n" + sources + "});";
};

module.exports = function(fileName, packages) {
  init();
  if (!packages) {
    throw new PluginError('gulp-stitch-sourcemap', 'Missing packages option for gulp-stitch-sourcemap');
  }
  G.packages = packages;
  G.resultMap = new SourceMapGenerator({
    file: fileName
  });
  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-concat', 'Streaming not supported'));
      cb();
      return;
    }
    if (!file.sourceMap) {
      file.sourceMap = generateSourceMap(file);
    }
    G.definitions += compileSource(file);
    return cb();
  }, function(cb) {
    var file;
    file = new gutil.File();
    file.path = join(G.rootPath, fileName);
    file.contents = new Buffer(wrapSources(G.definitions.slice(2)));
    file.sourceMap = JSON.parse(G.resultMap.toString());
    this.push(file);
    return cb();
  });
};

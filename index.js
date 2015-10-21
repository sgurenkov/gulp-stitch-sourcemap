var PluginError, SourceMapConsumer, SourceMapGenerator, compileSource, definitions, escodegen, esprima, extname, fileList, generateSourceMap, getRelativePath, gutil, join, lineOffset, packages, ref, ref1, resultMap, rootPath, through, wrapSources;

through = require('through2');

gutil = require('gulp-util');

ref = require('path'), extname = ref.extname, join = ref.join;

ref1 = require('source-map'), SourceMapConsumer = ref1.SourceMapConsumer, SourceMapGenerator = ref1.SourceMapGenerator;

esprima = require('esprima');

escodegen = require('escodegen');

PluginError = gutil.PluginError;

fileList = {};

definitions = '';

packages = null;

rootPath = process.cwd();

lineOffset = 1;

resultMap = null;

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
  var base, i, len, pPath;
  for (i = 0, len = packages.length; i < len; i++) {
    pPath = packages[i];
    base = rootPath + '/' + pPath + '/';
    if (path.indexOf(base) === 0) {
      return path.slice(base.length).slice(0, -extname(path).length);
    }
  }
  return '';
};

compileSource = function(file) {
  var exportList, i, len, match, matches, name, orig, source;
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
  fileList[name] = exportList;
  lineOffset++;
  if (file.sourceMap) {
    orig = new SourceMapConsumer(file.sourceMap);
    orig.eachMapping((function(_this) {
      return function(m) {
        return resultMap.addMapping({
          generated: {
            line: m.generatedLine + lineOffset,
            column: m.generatedColumn
          },
          original: {
            line: m.originalLine || m.generatedLine,
            column: m.originalColumn || m.generatedColumn
          },
          source: file.sourceMap.sources[0],
          name: m.name
        });
      };
    })(this));
    resultMap.setSourceContent(file.sourceMap.sources[0], file.sourceMap.sourcesContent[0]);
  }
  lineOffset += source.split('\n').length - 1;
  return ", '" + name + "': function(exports, require, module) {\n" + source + "}";
};

wrapSources = function(sources) {
  var exportedName, exportedNames, filePath, i, len, result;
  result = "(function(/*!Stitch!*/){if (!this.require) { var modules = {}, cache = {}, require = function(name, root) { var path = expand(root, name), module = cache[path], fn; if (module) { return module.exports; } else if (fn = modules[path] || modules[path = expand(path, './index')]) { module = {id: path, exports: {}}; try { cache[path] = module; fn(module.exports, function(name) { return require(name, dirname(path)); }, module); return module.exports; } catch (err) { delete cache[path]; throw err; } } else { throw 'module \\'' + name + '\\' not found'; } }, expand = function(root, name) { var results = [], parts, part; if (/^\\.\\.?(\\/|$)/.test(name)) { parts = [root, name].join('/').split('/'); } else { parts = name.split('/'); } for (var i = 0, length = parts.length; i < length; i++) { part = parts[i]; if (part == '..') { results.pop(); } else if (part != '.' && part != '') { results.push(part); } } return results.join('/'); }, dirname = function(path) { return path.split('/').slice(0, -1).join('/'); }; this.require = function(name) { return require(name, ''); }; this.require.define = function(bundle) { for (var key in bundle) modules[key] = bundle[key];};}";
  result += "var a = {};";
  for (filePath in fileList) {
    exportedNames = fileList[filePath];
    for (i = 0, len = exportedNames.length; i < len; i++) {
      exportedName = exportedNames[i];
      if (exportedName.match(/^[a-z]+[a-z0-9]*$/i)) {
        result += "a['" + exportedName + "']='" + filePath + "';";
      }
    }
  }
  return result += "this.require.exportsFileMap=a;return this.require.define;}).call(this)({\n" + sources + "});";
};

module.exports = function(fileName, _packages) {
  if (!_packages) {
    throw new PluginError('gulp-stitch-sourcemap', 'Missing packages option for gulp-stitch-sourcemap');
  }
  packages = _packages;
  resultMap = new SourceMapGenerator({
    file: fileName
  });
  return through.obj(function(file, enc, cb) {
    if (!file.sourceMap) {
      file.sourceMap = generateSourceMap(file);
    }
    definitions += compileSource(file);
    return cb();
  }, function(cb) {
    var file;
    file = new gutil.File();
    file.path = join(rootPath, fileName);
    file.contents = new Buffer(wrapSources(definitions.slice(2)));
    file.sourceMap = JSON.parse(resultMap.toString());
    this.push(file);
    return cb();
  });
};

var G, PluginError, SourceMapConsumer, SourceMapGenerator, applySourceMap, cache, coffee, compileSource, escodegen, esprima, extname, fs, generateSourceMap, getRelativePath, gutil, init, join, path, processFile, ref, ref1, saveCache, through, typeIsArray, wrapSources;

through = require('through2');

gutil = require('gulp-util');

ref = require('path'), extname = ref.extname, join = ref.join;

ref1 = require('source-map'), SourceMapConsumer = ref1.SourceMapConsumer, SourceMapGenerator = ref1.SourceMapGenerator;

esprima = require('esprima');

escodegen = require('escodegen');

coffee = require('coffee-script');

applySourceMap = require('vinyl-sourcemaps-apply');

path = require('path');

fs = require('fs');

PluginError = gutil.PluginError;

cache = {};

G = {};

typeIsArray = function(value) {
  return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number' && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
};

init = function(opts) {
  if (!opts || !opts.output) {
    throw new PluginError('gulp-stitch-sourcemap', 'Missing output (file name) option for gulp-stitch-sourcemap');
  }
  if (!opts.packages || !typeIsArray(opts.packages)) {
    throw new PluginError('gulp-stitch-sourcemap', 'Missing or incorrect type of packages option for gulp-stitch-sourcemap');
  }
  return G = {
    output: opts.output,
    cache: opts.cache || false,
    packages: opts.packages,
    fileList: {},
    definitions: '',
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

saveCache = function(path, file) {
  return cache[path] = {
    file: file,
    mtime: fs.statSync(path).mtime
  };
};

processFile = function(file) {
  var data, dest, filePath;
  filePath = file.path;
  if (G.cache && cache[filePath]) {
    if (cache[filePath].mtime >= fs.statSync(filePath).mtime) {
      return cache[filePath].file;
    } else {
      gutil.log(cache[filePath].mtime, fs.statSync(filePath).mtime);
      gutil.log('rebuild ' + filePath);
    }
  }
  if (path.extname(file.path) === '.coffee') {
    dest = gutil.replaceExtension(file.path, '.js');
    data = coffee.compile(file.contents.toString('utf8'), {
      bare: true,
      header: false,
      sourceMap: !!file.sourceMap,
      sourceRoot: false,
      filename: file.path,
      sourceFiles: [file.relative],
      generatedFile: gutil.replaceExtension(file.relative, '.js')
    });
    file.path = dest;
    if (data && data.v3SourceMap && file.sourceMap) {
      applySourceMap(file, data.v3SourceMap);
      file.contents = new Buffer(data.js);
    } else {
      file.contents = new Buffer(data);
    }
  } else {
    if (!!file.sourceMap && !file.sourceMap.mappings) {
      file.sourceMap = generateSourceMap(file);
    }
  }
  if (G.cache) {
    saveCache(filePath, file);
  }
  return file;
};


/*
  opts = {
    output: - output file name, (String)
    packages: - packages to build, (String[])
    cache: - use cache (boolean)
  }
 */

module.exports = function(opts) {
  init(opts);
  G.resultMap = new SourceMapGenerator({
    file: G.output
  });
  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-concat', 'Streaming not supported'));
      cb();
      return;
    }
    file = processFile(file);
    G.definitions += compileSource(file);
    return cb();
  }, function(cb) {
    var file;
    file = new gutil.File();
    file.path = join(G.rootPath, G.output);
    file.contents = new Buffer(wrapSources(G.definitions.slice(2)));
    file.sourceMap = JSON.parse(G.resultMap.toString());
    this.push(file);
    return cb();
  });
};

module.exports.cache = cache;

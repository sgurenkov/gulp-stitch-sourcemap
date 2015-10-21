through = require('through2');
gutil = require('gulp-util');
{extname, join} = require('path');
{SourceMapConsumer, SourceMapGenerator} = require 'source-map'
esprima = require('esprima')
escodegen = require('escodegen')
PluginError = gutil.PluginError;

fileList = {}
definitions = ''
packages = null
rootPath = process.cwd()
lineOffset = 1
resultMap = null

generateSourceMap = (file) ->
  ast = esprima.parse file.contents,
    loc: true,
    source: file.relative
  astGen = escodegen.generate ast,
    sourceMap: true,
    sourceMapWithCode: true,
    file: file.relative
  astGen.map.setSourceContent file.relative, String(file.contents)
  JSON.parse astGen.map.toString()

getRelativePath = (path) ->
  for pPath in packages
    base = rootPath + '/' + pPath + '/'
    if path.indexOf(base) is 0
      return path.slice(base.length).slice(0, -extname(path).length)

  return ''

compileSource = (file) ->
  name = getRelativePath file.path
  source = String file.contents
  exportList = []
  matches = source.match /exports\.([^ ]*)/ig
  if matches
    exportList.push match.replace /exports\./, '' for match in matches

  fileList[name] = exportList

  # source map
  lineOffset++
  if file.sourceMap
    orig = new SourceMapConsumer file.sourceMap
    orig.eachMapping (m) =>
      resultMap.addMapping
        generated:
          line: m.generatedLine + lineOffset
          column: m.generatedColumn
        original:
          line: m.originalLine or m.generatedLine
          column: m.originalColumn or m.generatedColumn
        source: file.sourceMap.sources[0]
        name: m.name
    resultMap.setSourceContent file.sourceMap.sources[0], file.sourceMap.sourcesContent[0]

  lineOffset += source.split('\n').length - 1
  ", '#{name}': function(exports, require, module) {\n#{source}}"

wrapSources = (sources)->
  result = "(function(/*!Stitch!*/){if (!this.require) { var modules = {}, cache = {}, require = function(name, root) { var path = expand(root, name), module = cache[path], fn; if (module) { return module.exports; } else if (fn = modules[path] || modules[path = expand(path, './index')]) { module = {id: path, exports: {}}; try { cache[path] = module; fn(module.exports, function(name) { return require(name, dirname(path)); }, module); return module.exports; } catch (err) { delete cache[path]; throw err; } } else { throw 'module \\'' + name + '\\' not found'; } }, expand = function(root, name) { var results = [], parts, part; if (/^\\.\\.?(\\/|$)/.test(name)) { parts = [root, name].join('/').split('/'); } else { parts = name.split('/'); } for (var i = 0, length = parts.length; i < length; i++) { part = parts[i]; if (part == '..') { results.pop(); } else if (part != '.' && part != '') { results.push(part); } } return results.join('/'); }, dirname = function(path) { return path.split('/').slice(0, -1).join('/'); }; this.require = function(name) { return require(name, ''); }; this.require.define = function(bundle) { for (var key in bundle) modules[key] = bundle[key];};}"

  result += "var a = {};"
  for filePath,exportedNames of fileList
    for exportedName in exportedNames
      if exportedName.match /^[a-z]+[a-z0-9]*$/i
        result += "a['#{exportedName}']='#{filePath}';"

  result += "this.require.exportsFileMap=a;return this.require.define;}).call(this)({\n#{sources}});"

module.exports = (fileName, _packages) ->
  if not _packages
    throw new PluginError 'gulp-stitch-sourcemap', 'Missing packages option for gulp-stitch-sourcemap'
  packages = _packages
  resultMap = new SourceMapGenerator
    file: fileName

  return through.obj (file, enc, cb) ->
    file.sourceMap = generateSourceMap file if not file.sourceMap
    definitions += compileSource file
    cb()
  , (cb) ->
    file = new gutil.File();
    file.path = join(rootPath, fileName);
    file.contents = new Buffer wrapSources definitions.slice(2)
    file.sourceMap = JSON.parse(resultMap.toString())
    this.push(file)
    cb()


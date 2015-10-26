through = require('through2');
gutil = require('gulp-util');
{extname, join} = require('path');
{SourceMapConsumer, SourceMapGenerator} = require 'source-map'
esprima = require('esprima')
escodegen = require('escodegen')
coffee = require('coffee-script')
applySourceMap = require('vinyl-sourcemaps-apply');
path = require('path')
fs = require('fs')
PluginError = gutil.PluginError
cache = {}
G = {}

typeIsArray = ( value ) ->
  value and
    typeof value is 'object' and
    value instanceof Array and
    typeof value.length is 'number' and
    typeof value.splice is 'function' and
    not ( value.propertyIsEnumerable 'length' )

init = (opts)->
  if not opts or not opts.output
    throw new PluginError 'gulp-stitch-sourcemap', 'Missing output (file name) option for gulp-stitch-sourcemap'
  if not opts.packages or not typeIsArray opts.packages
    throw new PluginError 'gulp-stitch-sourcemap', 'Missing or incorrect type of packages option for gulp-stitch-sourcemap'
  G =
    output: opts.output,
    cache: opts.cache or false
    packages: opts.packages
    fileList: {}
    definitions: ''
    rootPath: process.cwd()
    lineOffset: 1
    resultMap: null

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
  for pPath in G.packages
    base = G.rootPath + '/' + pPath + '/'
    if path.indexOf(base) is 0
      return path.slice(base.length).slice(0, -extname(path).length)

  return ''

compileSource = (file) ->
  if file.isStream()
    throw new PluginError 'gulp-stitch-sourcemap', ''
  name = getRelativePath file.path
  source = String file.contents
  exportList = []
  matches = source.match /exports\.([^ ]*)/ig
  if matches
    exportList.push match.replace /exports\./, '' for match in matches

  G.fileList[name] = exportList

  # source map
  G.lineOffset++
  if file.sourceMap
    orig = new SourceMapConsumer file.sourceMap
    orig.eachMapping (m) =>
      G.resultMap.addMapping
        generated:
          line: parseInt(m.generatedLine) + G.lineOffset
          column: m.generatedColumn
        original:
          line: m.originalLine
          column: m.originalColumn
        source: file.sourceMap.sources[0]
        name: m.name
    G.resultMap.setSourceContent file.sourceMap.sources[0], file.sourceMap.sourcesContent[0]
  G.lineOffset += source.split('\n').length
  ", '#{name}': function(exports, require, module) {\n#{source}\n}"

wrapSources = (sources)->
  result = "(function(/*!Stitch!*/){if (!this.require) { var modules = {}, cache = {}, require = function(name, root) { var path = expand(root, name), module = cache[path], fn; if (module) { return module.exports; } else if (fn = modules[path] || modules[path = expand(path, './index')]) { module = {id: path, exports: {}}; try { cache[path] = module; fn(module.exports, function(name) { return require(name, dirname(path)); }, module); return module.exports; } catch (err) { delete cache[path]; throw err; } } else { throw 'module \\'' + name + '\\' not found'; } }, expand = function(root, name) { var results = [], parts, part; if (/^\\.\\.?(\\/|$)/.test(name)) { parts = [root, name].join('/').split('/'); } else { parts = name.split('/'); } for (var i = 0, length = parts.length; i < length; i++) { part = parts[i]; if (part == '..') { results.pop(); } else if (part != '.' && part != '') { results.push(part); } } return results.join('/'); }, dirname = function(path) { return path.split('/').slice(0, -1).join('/'); }; this.require = function(name) { return require(name, ''); }; this.require.define = function(bundle) { for (var key in bundle) modules[key] = bundle[key];};}"

  result += "var a = {};"
  for filePath,exportedNames of G.fileList
    for exportedName in exportedNames
      if exportedName.match /^[a-z]+[a-z0-9]*$/i
        result += "a['#{exportedName}']='#{filePath}';"

  result += "this.require.exportsFileMap=a;return this.require.define;}).call(this)({\n#{sources}});"

saveCache = (path, file) ->
  cache[path] = {
    file: file,
    mtime: fs.statSync(path).mtime
  }

processFile = (file) ->
  filePath = file.path

  # return from cache if exists
  if G.cache and cache[filePath]
    if cache[filePath].mtime >= fs.statSync(filePath).mtime
      return cache[filePath].file
    else
      gutil.log(cache[filePath].mtime, fs.statSync(filePath).mtime)
      gutil.log('rebuild ' + filePath)

  if path.extname(file.path) is '.coffee'
    dest = gutil.replaceExtension(file.path, '.js')
    data = coffee.compile(file.contents.toString('utf8'), {
      bare: true
      header: false
      sourceMap: !!file.sourceMap
      sourceRoot: false
      filename: file.path
      sourceFiles: [file.relative]
      generatedFile: gutil.replaceExtension file.relative, '.js'
    })
    file.path = dest
    if data and data.v3SourceMap and file.sourceMap
      applySourceMap(file, data.v3SourceMap)
      file.contents = new Buffer data.js
    else
      file.contents = new Buffer(data);
  else
    file.sourceMap = generateSourceMap(file) if !!file.sourceMap && not file.sourceMap.mappings

  saveCache(filePath, file) if G.cache
  return file
###
  opts = {
    output: - output file name, (String)
    packages: - packages to build, (String[])
    cache: - use cache (boolean)
  }
###
module.exports = (opts) ->
  init(opts)
  G.resultMap = new SourceMapGenerator
    file: G.output

  return through.obj (file, enc, cb) ->
    if file.isStream()
      this.emit 'error', new PluginError('gulp-concat',  'Streaming not supported')
      cb()
      return
    file = processFile file
    G.definitions += compileSource file
    cb()

  , (cb) ->
    file = new gutil.File();
    file.path = join(G.rootPath, G.output);
    file.contents = new Buffer wrapSources G.definitions.slice(2)
    file.sourceMap = JSON.parse(G.resultMap.toString())
    this.push(file)
    cb()

module.exports.cache = cache
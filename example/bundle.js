(function(/*!Stitch!*/){if (!this.require) { var modules = {}, cache = {}, require = function(name, root) { var path = expand(root, name), module = cache[path], fn; if (module) { return module.exports; } else if (fn = modules[path] || modules[path = expand(path, './index')]) { module = {id: path, exports: {}}; try { cache[path] = module; fn(module.exports, function(name) { return require(name, dirname(path)); }, module); return module.exports; } catch (err) { delete cache[path]; throw err; } } else { throw 'module \'' + name + '\' not found'; } }, expand = function(root, name) { var results = [], parts, part; if (/^\.\.?(\/|$)/.test(name)) { parts = [root, name].join('/').split('/'); } else { parts = name.split('/'); } for (var i = 0, length = parts.length; i < length; i++) { part = parts[i]; if (part == '..') { results.pop(); } else if (part != '.' && part != '') { results.push(part); } } return results.join('/'); }, dirname = function(path) { return path.split('/').slice(0, -1).join('/'); }; this.require = function(name) { return require(name, ''); }; this.require.define = function(bundle) { for (var key in bundle) modules[key] = bundle[key];};}var a = {};a['superVar']='a';this.require.exportsFileMap=a;return this.require.define;}).call(this)({
'test': function(exports, require, module) {
var a, alpha, b, bbb, log, test;

a = require('a');

b = require('b');

bbb = require('bbb');

alpha = require('alpha/index');

log = require('vendor/log');

test = function() {
  return log(a.superVar, b, alpha, bbb);
};

module.exports = test;
}, 'vendor/log': function(exports, require, module) {
var slice = [].slice;

module.exports = function() {
  var a, b, c, value;
  value = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  a = 1;
  b = 2;
  c = a + b;
  console.log(value + ' ' + c);
  true;
  return true;
};
}, 'bbb': function(exports, require, module) {
module.exports = 'bbb';}, 'alpha/index': function(exports, require, module) {
module.exports = 'alpha';
}, 'a': function(exports, require, module) {
module.exports.superVar = 'a';
}, 'b': function(exports, require, module) {
module.exports = 'b';
}});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QuY29mZmVlIiwidmVuZG9yL2xvZy5jb2ZmZWUiLCJiL2JiYi5qcyIsImEvYWxwaGEvaW5kZXguY29mZmVlIiwiYS9hLmNvZmZlZSIsImIvYi5jb2ZmZWUiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJOztBQUFKLENBQUMsR0FBRyxPQUFBLENBQVEsR0FBUjs7QUFDSixDQUFDLEdBQUcsT0FBQSxDQUFRLEdBQVI7O0FBQ0osR0FBRyxHQUFHLE9BQUEsQ0FBUSxLQUFSOztBQUNOLEtBQUssR0FBRyxPQUFBLENBQVEsYUFBUjs7QUFDUixHQUFHLEdBQUcsT0FBQSxDQUFRLFlBQVI7O0FBRU4sSUFBSSxHQUFHLFNBQUE7U0FDTCxHQUFBLENBQUksQ0FBQyxDQUFDLFFBQU4sRUFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsRUFBMEIsR0FBMUI7QUFESzs7QUFHUCxNQUFNLENBQUMsT0FBTyxHQUFHOztBQ1RqQixJQUFJOztBQUFKLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBQTtBQUNmLE1BQUE7RUFEZ0I7RUFDaEIsQ0FBQSxHQUFJO0VBQ0osQ0FBQSxHQUFJO0VBQ0osQ0FBQSxHQUFJLENBQUEsR0FBSTtFQUNSLE9BQU8sQ0FBQyxHQUFSLENBQVksS0FBQSxHQUFRLEdBQVIsR0FBYyxDQUExQjtFQUNBO1NBQ0E7QUFOZTs7QUNBakJBLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLEtBQUs7QUNBdEIsTUFBTSxDQUFDLE9BQU8sR0FBRzs7QUNBakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUc7O0FDQTFCLE1BQU0sQ0FBQyxPQUFPLEdBQUciLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYSA9IHJlcXVpcmUgJ2EnXG5iID0gcmVxdWlyZSAnYidcbmJiYiA9IHJlcXVpcmUgJ2JiYidcbmFscGhhID0gcmVxdWlyZSAnYWxwaGEvaW5kZXgnXG5sb2cgPSByZXF1aXJlICd2ZW5kb3IvbG9nJ1xuXG50ZXN0ID0gLT5cbiAgbG9nIGEuc3VwZXJWYXIsIGIsIGFscGhhLCBiYmJcblxubW9kdWxlLmV4cG9ydHMgPSB0ZXN0XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZS4uLikgLT5cbiAgYSA9IDFcbiAgYiA9IDJcbiAgYyA9IGEgKyBiXG4gIGNvbnNvbGUubG9nIHZhbHVlICsgJyAnICsgY1xuICB0cnVlXG4gIHRydWUiLCJtb2R1bGUuZXhwb3J0cyA9ICdiYmInOyIsIm1vZHVsZS5leHBvcnRzID0gJ2FscGhhJyIsIm1vZHVsZS5leHBvcnRzLnN1cGVyVmFyID0gJ2EnIiwibW9kdWxlLmV4cG9ydHMgPSAnYiciXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

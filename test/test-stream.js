var array = require('stream-array');
var File = require('gulp-util').File;
var Stream = require('stream');

module.exports = function () {
  var args = Array.prototype.slice.call(arguments);
  var isStream = false;
  if (args[args.length - 1] === 1) {
    args.pop();
    isStream = true;
  }

  var i = 0;

  function create(contents) {
    var content = isStream ? new Stream(contents) : new Buffer(contents);
    return new File({
      cwd: '/home/contra/',
      base: '/home/contra/test',
      path: '/home/contra/test/file' + (i++).toString() + '.js',
      contents: content,
      stat: {mode: 0666}
    });
  }

  return array(args.map(create))
};
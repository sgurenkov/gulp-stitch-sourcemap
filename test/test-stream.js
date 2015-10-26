var array = require('stream-array');
var File = require('gulp-util').File;
var Stream = require('stream');

module.exports = function (ext) {
  var args = Array.prototype.slice.call(arguments);
  var isStream, ext, filename;
  if (typeof(args[args.length - 1]) === 'object') {
    opts = args.pop();
    isStream = opts.stream || false;
    ext = opts.ext || '.js';
    filename = opts.filename || 'file';
  }

  var i = 0;

  function create(contents) {
    var content = isStream ? new Stream(contents) : new Buffer(contents);
    return new File({
      cwd: '/home/contra/',
      base: '/home/contra/test',
      path: '/home/contra/test/' + filename + (i++).toString() + ext,
      contents: content,
      stat: {mode: 0666}
    });
  }

  return array(args.map(create))
};
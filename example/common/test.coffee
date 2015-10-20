a = require 'a'
b = require 'b'
bbb = require 'bbb'
alpha = require 'alpha/index'
log = require 'vendor/log'

test = ->
  log a.superVar, b, alpha, bbb

module.exports = test

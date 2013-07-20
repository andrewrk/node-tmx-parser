var tmx = require('../');
var path = require('path');
var assert = require('assert');

var target = path.join(__dirname, 'lemming-level3-csv.tmx')

tmx.parseFile(target, function(err, map) {
  assert.ifError(err);
  console.log(map.layers);
});

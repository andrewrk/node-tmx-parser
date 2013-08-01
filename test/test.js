var tmx = require('../');
var path = require('path');
var assert = require('assert');

describe("tile encoding types", function() {
  it("csv", generateEncodingTypeTest("lemming-level3-csv.tmx"));
  it("xml", generateEncodingTypeTest("lemming-level3-xml.tmx"));
  it("b64-raw", generateEncodingTypeTest("lemming-level3-b64raw.tmx"));
  it("b64-zlib", generateEncodingTypeTest("lemming-level3-b64zlib.tmx"));
  it("b64-gzip", generateEncodingTypeTest("lemming-level3-b64gzip.tmx"));
});

describe("real world examples", function() {
  it("vapor test chamber");
  it("lemming level 1");
});

describe("tilesets", function() {
  it("ability to parse a tileset");
  it("embedded tileset");
  it("external tileset");
  it("multiple tilesets");
});

describe("misc.", function() {
  it("ellipse object");
  it("polygon object");
  it("polyline object");
  it("polyline object");
});

function generateEncodingTypeTest(filename) {
  var target = path.join(__dirname, filename);
  return function(done) {
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);
      validateLemmingLevel3(map);
      done();
    });
  };
}

function validateLemmingLevel3(map) {
  assert.strictEqual(map.width, 200);
  assert.strictEqual(map.height, 70);
  assert.strictEqual(map.properties.bg_art, "background.png");
  assert.strictEqual(map.properties.fg_art, "hill.png");

  assert.strictEqual(map.tileSets.length, 1);
  assert.strictEqual(map.tileSets[0].firstGid, 1);
  assert.strictEqual(map.tileSets[0].source, "tiles.tsx");

  assert.strictEqual(map.layers.length, 4);
  assert.ok(map.layers[0] instanceof tmx.TileLayer);
  assert.strictEqual(map.layers[0].name, "Main");
  //assert.strictEqual(map.layers[0].tileAt(35, 29), 5);

  assert.ok(map.layers[1] instanceof tmx.TileLayer);
  assert.strictEqual(map.layers[1].name, "Ladders");

  assert.ok(map.layers[2] instanceof tmx.ObjectLayer);
  assert.strictEqual(map.layers[2].name, "Object Layer 1");

  assert.ok(map.layers[3] instanceof tmx.ObjectLayer);
  assert.strictEqual(map.layers[3].name, "PlayerLayer");
}

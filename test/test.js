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
  it("vapor test chamber", function(done) {
    var target = path.join(__dirname, "vapor-test.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);

      assert.strictEqual(map.width, 10);
      assert.strictEqual(map.height, 10);
      assert.strictEqual(map.layers[2].name, "objects");
      assert.strictEqual(map.layers[2].objects.length, 3);

      done();
    });
  });
  it("lemming level 1", function(done) {
    var target = path.join(__dirname, "lemming-level1.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);

      assert.strictEqual(map.width, 200);
      assert.strictEqual(map.height, 100);
      assert.strictEqual(map.layers[0].name, "Tiles");
      assert.strictEqual(map.layers[0].tileAt(112, 49).properties.mine, "1");

      done();
    });
  });
});

describe("tilesets", function() {
  it("ability to parse a tileset", function(done) {
    var target = path.join(__dirname, "tiles.tsx");
    tmx.parseFile(target, function(err, tileSet) {
      if (err) return done(err);

      assert.strictEqual(tileSet.image.height, 192);
      assert.strictEqual(tileSet.tiles.length, 30);
      assert.strictEqual(tileSet.tiles[0].properties.name, "DirtRampRight");
      assert.strictEqual(tileSet.tiles[5].properties.solid, "1");

      done();
    });
  });
  it("embedded tileset", function(done) {
    var target = path.join(__dirname, "embedded-tileset.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);
      assert.strictEqual(map.tileSets.length, 1);
      assert.strictEqual(map.tileSets[0].properties.derp, "herp");
      assert.strictEqual(map.tileSets[0].image.width, 265);

      assert.strictEqual(map.tileSets[0].terrainTypes.length, 4);
      assert.strictEqual(map.tileSets[0].terrainTypes[0].name, "brick");
      assert.strictEqual(map.tileSets[0].terrainTypes[0].tile, 9);
      assert.strictEqual(map.tileSets[0].terrainTypes[0].properties.happiness, "yes");
      assert.strictEqual(map.tileSets[0].terrainTypes[1].name, "gravel");
      assert.strictEqual(map.tileSets[0].terrainTypes[2].name, "rock");
      assert.strictEqual(map.tileSets[0].terrainTypes[3].name, "sand");

      assert.strictEqual(map.tileSets[0].tiles.length, 45);
      assert.strictEqual(map.tileSets[0].tiles[0].id, 0);

      assert.strictEqual(map.tileSets[0].tiles[0].terrain.length, 4);
      assert.strictEqual(map.tileSets[0].tiles[0].terrain[0],
        map.tileSets[0].terrainTypes[3]);

      assert.strictEqual(map.tileSets[0].tiles[9].properties.brickcenter, "true");
      done();
    });
  });
  it("multiple tilesets", function(done) {
    var target = path.join(__dirname, "multiple-tile-sets.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);
      assert.strictEqual(map.tileSets.length, 2);

      assert.strictEqual(map.tileSets[0].name, "red");
      assert.strictEqual(map.tileSets[0].tiles[0].properties.good, "nope");
      assert.strictEqual(map.tileSets[1].name, "blue");
      assert.strictEqual(map.tileSets[1].tiles[4].properties.good, "yes");

      assert.strictEqual(map.layers[0].tileAt(16, 12), map.tileSets[0].tiles[0]);
      assert.strictEqual(map.layers[0].tileAt(16, 12).gid, 1);
      assert.strictEqual(map.layers[0].tileAt(17, 12), map.tileSets[1].tiles[4]);
      assert.strictEqual(map.layers[0].tileAt(17, 12).gid, 10);
      assert.equal(map.layers[0].tileAt(20, 12), null);

      done();
    });
  });
});

describe("weird shapes", function() {
  it("ellipse, polygon, polyline", function(done) {
    var target = path.join(__dirname, "weird-shapes.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);

      assert.strictEqual(map.layers[0].objects[0].name, "Ellipse");
      assert.strictEqual(map.layers[0].objects[0].ellipse, true);

      assert.strictEqual(map.layers[0].objects[1].name, "Polygon");
      assert.deepEqual(map.layers[0].objects[1].polygon, [
        {x: 0, y: 0},
        {x: 131, y: 9},
        {x: 38, y: -112},
        {x: -83, y: -47},
      ]);

      assert.strictEqual(map.layers[0].objects[2].name, "Polyline");
      assert.deepEqual(map.layers[0].objects[2].polyline, [
        {x: 0, y: 0},
        {x: 98, y: 64},
        {x: 77, y: 165},
        {x: 180, y: 150},
        {x: 257, y: -7},
        {x: 148, y: -76},
      ]);
      done();
    });
  });
});

describe("implicit tiles", function() {
  it("creates implicit tiles", function(done) {
    var target = path.join(__dirname, "implicit_tiles.tmx");
    tmx.parseFile(target, function(err, map) {
      if (err) return done(err);
      assert.strictEqual(map.tileSets[0].tiles.length, 2);

      assert.strictEqual(map.layers[0].tileAt(0, 0).id, 0);
      assert.strictEqual(map.layers[0].tileAt(1, 0).id, 1);
      assert.strictEqual(map.layers[0].tileAt(1, 1).id, 0);
      assert.strictEqual(map.layers[0].tileAt(1, 2).id, 1);
      assert.strictEqual(map.layers[0].tileAt(2, 2).id, 0);
      assert.strictEqual(map.layers[0].tileAt(3, 2).id, 1);
      assert.strictEqual(map.layers[0].tileAt(3, 3).id, 0);
      done();
    });
  });
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
  assert.strictEqual(map.layers[0].tileAt(35, 28),
      map.tileSets[0].tiles[5]);
  assert.strictEqual(map.layers[0].tileAt(67, 42).properties.name, "PlusOne");
  assert.strictEqual(map.layers[1].tileAt(96, 23).properties.ladder, "1");

  assert.ok(map.layers[1] instanceof tmx.TileLayer);
  assert.strictEqual(map.layers[1].name, "Ladders");

  assert.ok(map.layers[2] instanceof tmx.ObjectLayer);
  assert.strictEqual(map.layers[2].name, "Object Layer 1");

  assert.ok(map.layers[3] instanceof tmx.ObjectLayer);
  assert.strictEqual(map.layers[3].name, "PlayerLayer");
}

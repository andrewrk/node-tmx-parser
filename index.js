var sax = require('sax');
var fs = require('fs');

exports.readFile = defaultReadFile;
exports.parseFile = parseFile;
exports.parse = parse;
exports.TmxMap = TmxMap;
exports.TileSet = TileSet;
exports.Image = Image;
exports.Tile = Tile;
exports.TileLayer = TileLayer;
exports.ObjectLayer = ObjectLayer;
exports.ImageLayer = ImageLayer;
exports.TmxObject = TmxObject;

var FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
var FLIPPED_VERTICALLY_FLAG   = 0x40000000;
var FLIPPED_DIAGONALLY_FLAG   = 0x20000000;

var STATE_START              = 0;
var STATE_MAP                = 1;
var STATE_COLLECT_PROPS      = 2;
var STATE_WAIT_FOR_CLOSE     = 3;
var STATE_MAP_TILESET        = 4;
var STATE_TILE               = 5;
var STATE_TILE_LAYER         = 6;
var STATE_OBJECT_LAYER       = 7;
var STATE_OBJECT             = 8;
var STATE_IMAGE_LAYER        = 9;
var STATE_TILE_DATA_XML      = 10;
var STATE_TILE_DATA_CSV      = 11;
var STATE_TILE_DATA_B64_RAW  = 12;
var STATE_TILE_DATA_B64_GZIP = 13;
var STATE_TILE_DATA_B64_ZLIB = 14;

var STATE_COUNT              = 15;

function parse(content, cb) {
  var parser = sax.parser();
  var map;

  var state = STATE_START;
  var states = new Array(STATE_COUNT);
  var waitForCloseNextState = 0;
  var waitForCloseOpenCount = 0;
  var propertiesObject = null;
  var propertiesNextState = 0;
  var tileIndex = 0;
  states[STATE_START] = {
    opentag: function(tag) {
      if (tag.name === 'MAP') {
        map = new TmxMap();
        map.version = tag.attributes.VERSION;
        map.orientation = tag.attributes.ORIENTATION;
        map.width = int(tag.attributes.WIDTH);
        map.height = int(tag.attributes.HEIGHT);
        map.tileWidth = int(tag.attributes.TILEWIDTH);
        map.tileHeight = int(tag.attributes.TILEHEIGHT);
        map.backgroundColor = tag.attributes.BACKGROUNDCOLOR;

        state = STATE_MAP;
      } else {
        waitForClose();
      }
    },
    closetag: noop,
    text: noop,
  };
  states[STATE_MAP] = {
    opentag: function(tag) {
      var layer;
      switch (tag.name) {
        case 'PROPERTIES':
          collectProperties(map.properties);
          break;
        case 'TILESET':
          var ts = new TileSet();
          ts.firstGid = int(tag.attributes.FIRSTGID);
          ts.source = tag.attributes.SOURCE;
          ts.name = tag.attributes.NAME;
          ts.tileWidth = int(tag.attributes.TILEWIDTH);
          ts.tileHeight = int(tag.attributes.TILEHEIGHT);
          ts.spacing = int(tag.attributes.SPACING);
          ts.margin = int(tag.attributes.MARGIN);

          map.tileSet = ts;
          state = STATE_MAP_TILESET;
          break;
        case 'LAYER':
          layer = new TileLayer(map.width * map.height);
          tileIndex = 0;
          layer.name = tag.attributes.NAME;
          layer.opacity = float(tag.attributes.OPACITY, 1);
          layer.visible = bool(tag.attributes.VISIBLE, true);
          map.layers.push(layer);
          state = STATE_TILE_LAYER;
          break;
        case 'OBJECTGROUP':
          layer = new ObjectLayer();
          layer.name = tag.attributes.NAME;
          layer.color = tag.attributes.COLOR;
          layer.opacity = float(tag.attributes.OPACITY, 1);
          layer.visible = bool(tag.attributes.VISIBLE, true);
          map.layers.push(layer);
          state = STATE_OBJECT_LAYER;
          break;
        case 'IMAGELAYER':
          layer = new ImageLayer();
          layer.name = tag.attributes.NAME;
          layer.opacity = float(tag.attributes.OPACITY, 1);
          layer.visible = bool(tag.attributes.VISIBLE, true);
          map.layers.push(layer);
          state = STATE_IMAGE_LAYER;
          break;
        default:
          waitForClose();
      }
    },
    closetag: noop,
    text: noop,
  };
  states[STATE_MAP_TILESET] = {
    opentag: function(tag) {
      switch (tag.name) {
        case 'TILEOFFSET':
          map.tileSet.tileOffset.x = int(tag.attributes.X);
          map.tileSet.tileOffset.y = int(tag.attributes.Y);
          waitForClose();
          break;
        case 'PROPERTIES':
          collectProperties(map.tileSet.properties);
          break;
        case 'IMAGE':
          map.tileSet.image = collectImage(tag);
          break;
        case 'TERRAINTYPES':
          // TODO
          waitForClose();
          break;
        case 'TILE':
          var tile = new Tile();
          tile.id = int(tag.attributes.ID);
          tile.terrain = tag.attributes.TERRAIN;
          tile.probability = float(tag.attributes.PROBABILITY);
          map.tileSet.tiles.push(tile);
          state = STATE_TILE;
          break;
        default:
          waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_MAP;
    },
    text: noop,
  };
  states[STATE_COLLECT_PROPS] = {
    opentag: function(tag) {
      if (tag.name === 'PROPERTY') {
        propertiesObject[tag.attributes.NAME] = tag.attributes.VALUE;
      }
      waitForClose();
    },
    closetag: function(name) {
      state = propertiesNextState;
    },
    text: noop,
  };
  states[STATE_WAIT_FOR_CLOSE] = {
    opentag: function(tag) {
      waitForCloseOpenCount += 1;
    },
    closetag: function(name) {
      waitForCloseOpenCount -= 1;
      if (waitForCloseOpenCount === 0) state = waitForCloseNextState;
    },
    text: noop,
  };
  states[STATE_TILE] = {
    opentag: function(tag) {
      var lastTile = map.tileSet.tiles[map.tileSet.tiles.length - 1];
      if (tag.name === 'PROPERTIES') {
        collectProperties(lastTile.properties);
      } else if (tag.name === 'IMAGE') {
        lastTile.image = collectImage(tag);
      } else {
        waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_MAP_TILESET
    },
    text: noop,
  };
  states[STATE_TILE_LAYER] = {
    opentag: function(tag) {
      if (tag.name === 'PROPERTIES') {
        var lastLayer = map.layers[map.layers.length - 1];
        collectProperties(lastLayer.properties);
      } else if (tag.name === 'DATA') {
        var dataEncoding = tag.attributes.ENCODING;
        var dataCompression = tag.attributes.COMPRESSION;
        switch (dataEncoding) {
          case undefined:
          case null:
            state = STATE_TILE_DATA_XML;
            break;
          case 'csv':
            state = STATE_TILE_DATA_CSV;
            break;
          case 'base64':
            switch (dataCompression) {
              case undefined:
              case null:
                state = STATE_TILE_DATA_B64_RAW;
                break;
              case 'gzip':
                state = STATE_TILE_DATA_B64_GZIP;
                break;
              case 'zlib':
                state = STATE_TILE_DATA_B64_ZLIB;
                break;
              default:
                error(new Error("unsupported data compression: " + dataCompression));
                return;
            }
            break;
          default:
            error(new Error("unsupported data encoding: " + dataEncoding));
            return;
        }
      } else {
        waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_MAP;
    },
    text: noop,
  };
  states[STATE_OBJECT_LAYER] = {
    opentag: function(tag) {
      var lastLayer = map.layers[map.layers.length - 1];
      if (tag.name === 'PROPERTIES') {
        collectProperties(lastLayer.properties);
      } else if (tag.name === 'OBJECT') {
        var obj = new TmxObject();
        obj.name = tag.attributes.NAME;
        obj.type = tag.attributes.TYPE;
        obj.x = int(tag.attributes.X);
        obj.y = int(tag.attributes.Y);
        obj.width = int(tag.attributes.WIDTH, 0);
        obj.height = int(tag.attributes.HEIGHT, 0);
        obj.rotation = float(tag.attributes.ROTATION, 0);
        obj.gid = int(tag.attributes.GID);
        obj.visible = bool(tag.attributes.VISIBLE, true);
        lastLayer.objects.push(obj);
        state = STATE_OBJECT;
      } else {
        waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_MAP;
    },
    text: noop,
  };
  states[STATE_IMAGE_LAYER] = {
    opentag: function(tag) {
      var lastLayer = map.layers[map.layers.length - 1];
      if (tag.name === 'PROPERTIES') {
        collectProperties(lastLayer.properties);
      } else if (tag.name === 'IMAGE') {
        lastLayer.image = collectImage(tag);
      } else {
        waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_MAP;
    },
    text: noop,
  };
  states[STATE_OBJECT] = {
    opentag: function(tag) {
      var lastLayer = map.layers[map.layers.length - 1];
      var lastObject = lastLayer.objects[lastLayer.objects.length - 1];
      switch (tag.name) {
        case 'PROPERTIES':
          collectProperties(lastObject.properties);
          break;
        case 'ELLIPSE':
          lastObject.ellipse = true;
          waitForClose();
          break;
        case 'POLYGON':
          lastObject.polygon = parsePoints(tag.attributes.POINTS);
          waitForClose();
          break;
        case 'POLYLINE':
          lastObject.polyline = parsePoints(tag.attributes.POINTS);
          waitForClose();
          break;
        case 'IMAGE':
          lastObject.image = collectImage(tag);
          break;
        default:
          waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_OBJECT_LAYER;
    },
    text: noop,
  };
  states[STATE_TILE_DATA_XML] = {
    opentag: function(tag) {
      if (tag.name === 'TILE') {
        saveTile(int(tag.attributes.GID, 0));
      } else {
        waitForClose();
      }
    },
    closetag: function(name) {
      state = STATE_TILE_LAYER;
    },
    text: function(text) {
    },
  };
  states[STATE_TILE_DATA_CSV] = {
    opentag: function(tag) {
      waitForClose();
    },
    closetag: function(name) {
      state = STATE_TILE_LAYER;
    },
    text: function(text) {
      var buffer = "";
      for (var i = 0; i < text.length; i += 1) {
        var c = text[i];
        if (c === ',') {
          saveTile(parseInt(buffer, 10));
          buffer = "";
        } else {
          buffer += c;
        }
      }
    },
  };
  states[STATE_TILE_DATA_B64_RAW] = {
    opentag: function(tag) {
      waitForClose();
    },
    closetag: function(name) {
      state = STATE_TILE_LAYER;
    },
    text: function(text) {
      // TODO
    },
  };
  states[STATE_TILE_DATA_B64_GZIP] = {
    opentag: function(tag) {
      waitForClose();
    },
    closetag: function(name) {
      state = STATE_TILE_LAYER;
    },
    text: function(text) {
      // TODO
    },
  };
  states[STATE_TILE_DATA_B64_ZLIB] = {
    opentag: function(tag) {
      waitForClose();
    },
    closetag: function(name) {
      state = STATE_TILE_LAYER;
    },
    text: function(text) {
      // TODO
    },
  };

  parser.onerror = cb;
  parser.onopentag = function(tag) {
    states[state].opentag(tag);
  };
  parser.onclosetag = function(name) {
    states[state].closetag(name);
  };
  parser.ontext = function(text) {
    states[state].text(text);
  };
  parser.onend = function() {
    cb(null, map);
  };
  parser.write(content).close();

  function saveTile(gid) {
    var lastLayer = map.layers[map.layers.length - 1];

    lastLayer.horizontalFlips[tileIndex] = !!(gid & FLIPPED_HORIZONTALLY_FLAG);
    lastLayer.verticalFlips[tileIndex]   = !!(gid & FLIPPED_VERTICALLY_FLAG);
    lastLayer.diagonalFlips[tileIndex]   = !!(gid & FLIPPED_DIAGONALLY_FLAG);

    gid &= ~(FLIPPED_HORIZONTALLY_FLAG |
             FLIPPED_VERTICALLY_FLAG |
             FLIPPED_DIAGONALLY_FLAG);

    lastLayer.tiles[tileIndex] = gid;

    tileIndex += 1;
  }

  function collectImage(tag) {
    var img = new Image();
    img.format = tag.attributes.FORMAT;
    img.source = tag.attributes.SOURCE;
    img.trans = tag.attributes.TRANS;
    img.width = int(tag.attributes.WIDTH);
    img.height = int(tag.attributes.HEIGHT);

    // TODO: read possible <data>
    waitForClose();
    return img;
  }

  function collectProperties(obj) {
    propertiesObject = obj;
    propertiesNextState = state;
    state = STATE_COLLECT_PROPS;
  }

  function waitForClose() {
    waitForCloseNextState = state;
    state = STATE_WAIT_FOR_CLOSE;
    waitForCloseOpenCount = 1;
  }

  function error(err) {
    parser.onerror = null;
    parser.onopentag = null;
    parser.onclosetag = null;
    parser.ontext = null;
    parser.onend = null;
    cb(err);
  }
}

function defaultReadFile(name, cb) {
  fs.readFile(name, { encoding: 'utf8' }, cb);
}

function parseFile(name, cb) {
  exports.readFile(name, function(err, content) {
    if (err) {
      cb(err);
    } else {
      parse(content, cb);
    }
  });
}

function parsePoints(str) {
  var points = str.split(" ");
  return points.map(function(pt) {
    var xy = pt.split(",");
    return {
      x: xy[0],
      y: xy[1],
    };
  });
}

function noop() {}

function int(value, defaultValue) {
  defaultValue = defaultValue == null ? null : defaultValue;
  return value == null ? defaultValue : parseInt(value, 10);
}

function bool(value, defaultValue) {
  defaultValue = defaultValue == null ? null : defaultValue;
  return value == null ? defaultValue : !!parseInt(value, 10);
}

function float(value, defaultValue) {
  defaultValue = defaultValue == null ? null : defaultValue;
  return value == null ? defaultValue : parseFloat(value, 10);
}

function TmxMap() {
  this.version = null;
  this.orientation = "orthogonal";
  this.width = null;
  this.height = null;
  this.tileWidth = null;
  this.tileHeight = null;
  this.backgroundColor = null;

  this.layers = [];
  this.properties = {};
  this.tileSet = null;
}


function TileSet() {
  this.firstGid = null;
  this.source = null;
  this.name = null;
  this.tileWidth = null;
  this.tileHeight = null;
  this.spacing = null;
  this.margin = null;
  this.tileOffset = {x: 0, y: 0};
  this.properties = {};
  this.image = null;
  this.tiles = [];
}

function Image() {
  this.format = null;
  this.source = null;
  this.trans = null;
  this.width = null;
  this.height = null;
}

function Tile() {
  this.id = null;
  this.terrain = null;
  this.probability = null;
  this.properties = {};
  this.image = null;
}

function TileLayer(tileCount) {
  this.type = "tile";
  this.name = null;
  this.opacity = 1;
  this.visible = true;
  this.properties = {};
  this.tiles = new Array(tileCount);
  this.horizontalFlips = new Array(tileCount);
  this.verticalFlips = new Array(tileCount);
  this.diagonalFlips = new Array(tileCount);
}

function ObjectLayer() {
  this.type = "object";
  this.name = null;
  this.color = null;
  this.opacity = 1;
  this.visible = true;
  this.properties = {};
  this.objects = [];
}

function ImageLayer() {
  this.type = "image";
  this.name = null;
  this.opacity = 1;
  this.visible = true;
  this.properties = {};
  this.image = null;
}

function TmxObject() {
  this.name = null;
  this.type = null;
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;
  this.rotation = 0;
  this.properties = {};
  this.gid = null;
  this.visible = true;
  this.ellipse = false;
  this.polygon = null;
  this.polyline = null;
}

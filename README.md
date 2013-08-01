# tmx parser

[Tiled Map Editor](http://www.mapeditor.org/) map parser made to work
in node.js or [browserify](http://browserify.org/).

## Usage

```js
var tmx = require('tmx-parser');

// if you have a string (pathToFile is for resolving tilesets if necessary)
tmx.parse(xmlString, pathToFile, function(err, map) {
  if (err) throw err;
  console.log(map);
});

// if you have a file
tmx.parseFile(filename, function(err, map) {
  if (err) throw err;
  console.log(map);
});
```

The second example in that list uses `tmx.readFile(filename, callback)`
and then calls `tmx.parse(...)` on the results.
So if you're in browserland, you can replace the `readFile` function
with your own asset loading function.

## Documentation

A parsed map looks something like this:

```js
{ version: '1.0',
  orientation: 'orthogonal',
  width: 200,
  height: 100,
  tileWidth: 16,
  tileHeight: 16,
  backgroundColor: undefined,
  layers: 
   [ { map: [Object],
       type: 'tile',
       name: 'Tiles',
       opacity: 1,
       visible: true,
       properties: {},
       tiles: [Object],
       horizontalFlips: [Object],
       verticalFlips: [Object],
       diagonalFlips: [Object] },
     { map: [Object],
       type: 'tile',
       name: 'Ladders',
       opacity: 1,
       visible: true,
       properties: {},
       tiles: [Object],
       horizontalFlips: [Object],
       verticalFlips: [Object],
       diagonalFlips: [Object] },
     { type: 'object',
       name: 'Objects',
       color: undefined,
       opacity: 1,
       visible: true,
       properties: {},
       objects: [Object] },
     { type: 'object',
       name: 'PlayerLayer',
       color: undefined,
       opacity: 1,
       visible: true,
       properties: {},
       objects: [] } ],
  properties: 
   { bg_art: 'background.png',
     bg_music: 'music/silly.mp3',
     fg_art: 'hill.png' },
  tileSets: 
   [ { firstGid: 1,
       source: 'tiles.tsx',
       name: 'default',
       tileWidth: 16,
       tileHeight: 16,
       spacing: null,
       margin: null,
       tileOffset: [Object],
       properties: {},
       image: [Object],
       tiles: [Object],
       terrainTypes: [] } ] }
```

The `objects` array looks like this:

```js
{ type: 'object',
  name: 'Objects',
  color: undefined,
  opacity: 1,
  visible: true,
  properties: {},
  objects: 
   [ { name: undefined,
       type: 'Decoration',
       x: 0,
       y: 640,
       width: 224,
       height: 240,
       rotation: 0,
       properties: [Object],
       gid: null,
       visible: true,
       ellipse: false,
       polygon: null,
       polyline: null },
     { name: 'movement text',
       type: 'Text',
       x: 240,
       y: 640,
       width: 336,
       height: 80,
       rotation: 0,
       properties: [Object],
       gid: null,
       visible: true,
       ellipse: false,
       polygon: null,
       polyline: null },
     { name: 'victory',
       type: 'Victory',
       x: 2976,
       y: 880,
       width: 224,
       height: 96,
       rotation: 0,
       properties: {},
       gid: null,
       visible: true,
       ellipse: false,
       polygon: null,
       polyline: null } ] }
```

TileLayer objects have a `tileAt(x, y)` method.
Otherwise you can access `layer.tiles` in row-major order.

See the bottom of index.js for more information.

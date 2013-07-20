# tmx parser

[Tiled Map Editor](http://www.mapeditor.org/) map parser made to work
in node.js or [browserify](http://browserify.org/).

## Usage

```js
var tmx = require('tmx-parser');

tmx.parseFile(target, function(err, map) {
  if (err) throw err;
  console.log(map);
});
```

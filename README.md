# tmx parser

[Tiled Map Editor](http://www.mapeditor.org/) map parser made to work
in node.js or [browserify](http://browserify.org/).

## Usage

```js
var tmx = require('tmx-parser');

// if you have a string
tmx.parse(xmlString, function(err, map) {
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

Read the bottom of index.js.

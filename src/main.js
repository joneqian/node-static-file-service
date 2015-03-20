var http = require("http");
var adapter = require("./server_adapter");
var Asset = require("./asset").Asset;

// Static file server.
var asset = new Asset();
adapter.createServer(asset).listen(8001);
console.log("Static file server is running at 8001 port.");
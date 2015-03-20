var url = require("url");
var fs = require("fs");
var path = require("path");
var mime = require("./mime").types;
var config = require("./config");

var Asset = function () {};

Asset.prototype.dispatch = function (request, response) {
    response.setHeader("Server", "Node/V5");
    var pathname = url.parse(request.url).pathname;
    //console.log("qqqqqqq");
    var errHandle = function (res) {
        res.writeHead(404, "Not Found", {'Content-Type': 'text/plain'});
        res.write("This request URL  was invaild.");
        res.end();
    };

    if (pathname.slice(-1) === "/") {
        errHandle(response);
        return;
    }

    var realPath = path.join("assets", path.normalize(pathname.replace(/\.\./g, "")));
    var pathHandle = function (realPath) {
        fs.stat(realPath, function (err, stats) {
            if (err) {
                errHandle(response);
            } else {
                if (stats.isDirectory()) {
                    if (realPath.indexOf("device_catalog") > 0) {
                        realPath = path.join(realPath, "/", config.Default.device_file);        
                    } else if (realPath.indexOf("screen_dump") > 0) {
                        realPath = path.join(realPath, "/", config.Default.screen_file);        
                    } else {
                        realPath = path.join(realPath, "/", config.Default.file);
                    }
                    pathHandle(realPath);
                } else {
                    var ext = path.extname(realPath);
                    ext = ext ? ext.slice(1) : 'unknown';
                    var contentType = mime[ext] || "text/plain";
                    response.setHeader("Content-Type", contentType);
                    response.setHeader('Content-Length', stats.size);

                    var lastModified = stats.mtime.toUTCString();
                    var ifModifiedSince = "If-Modified-Since".toLowerCase();
                    response.setHeader("Last-Modified", lastModified);

                    if (ext.match(config.Expires.fileMatch)) {
                        var expires = new Date();
                        expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                        response.setHeader("Expires", expires.toUTCString());
                        response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
                    }

                    if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
                        response.writeHead(304, "Not Modified");
                        response.end();
                    } else {
                        var compressHandle = function (raw, statusCode, reasonPhrase) {
                                var stream = raw;
                                response.writeHead(statusCode, reasonPhrase);
                                stream.pipe(response);
                            };

                        var raw = fs.createReadStream(realPath);
                        compressHandle(raw, 200);
                    }
                }
            }
        });
    };

    pathHandle(realPath);
};

exports.Asset = Asset;

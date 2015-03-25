var worker = require('pm').createWorker();
var logger_asset = require('./logger').asset;
var url = require("url");
var fs = require("fs");
var path = require("path");
var mime = require("../config/mime").types;
var config = require("../config/config");


worker.on('message', function(data, from, pid){
    //logger_http.debug(process.pid + ' http server get message from:' + from + '  data:' + data + ' pid:' + pid);
});


var s = require('http').createServer(function (request, response) {
    response.setHeader("Server", "Node/V5");
    var pathname = url.parse(request.url).pathname;
    logger_asset.info("aaaaaaa");
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
});

worker.ready(function(socket, which) {
    logger_asset.info(which + ':' + socket);
    debugger;
    s.emit('connection', socket);
});

worker.on('suicide', function (by) {
    logger_asset.info('suicide by ' + by);
});

process.on('uncaughtException', function (err) {
    logger_asset.error('Caught Exception:' + err);
});

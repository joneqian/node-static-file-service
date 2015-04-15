var worker = require('pm').createWorker();
var logger_asset = require('./logger').asset;
var url = require('url');
var fs = require('fs');
var path = require('path');
var mime = require('../config/mime').types;
var config = require('../config/config');


worker.on('message', function(data, from, pid) {
    //logger_http.debug(process.pid + ' http server get message from:' + from + '  data:' + data + ' pid:' + pid);
});


var s = require('http').createServer(function(request, response) {
    response.setHeader("Server", "Node/V5");
    var errHandle = function(res, error) {
        var err_info = error || 'This request URL  was invalid.';
        res.writeHead(404, 'Not Found', {
            'Content-Type': 'text/plain'
        });
        res.write(err_info);
        res.end();
    };

    if (request.method !== 'POST') {
        errHandle(response, 'request method error');
        return;
    }

    var url = request.url.split('?').shift().split('/')[1].toLowerCase();
    var buffer = '';

    request.on('data', function(data) {
        buffer += data;
    });

    request.on('end', function() {
        var realPath = config.Config.ASSET_PATH + url + '/';
        switch (url) {
            case 'device_catalog':
                realPath += config.Default.device_file;
                break;
            case 'screen_dump':
                try {
                    var obj = JSON.parse(buffer);
                    if (obj['name'] === undefined || obj['type'] === undefined) {
                        errHandle(response, 'data format error');
                        return;
                    }
                    realPath += obj['name'] + '.' + obj['type'];
                } catch (e) {
                    logger_asset.error('json parse error');
                    errHandle(response, 'data format error');
                    return;
                }
                break;
            default:
                errHandle(response, 'command error');
                return;
        }
        pathHandle(realPath);
    });

    var pathHandle = function(realPath) {
        fs.stat(realPath, function(err, stats) {
            if (err) {
               logger_asset.error('fs error:' + err);
                errHandle(response);
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
                    response.setHeader("Expires", expires.toLocaleString());
                    response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
                }

                if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
                    response.writeHead(304, "Not Modified");
                    response.end();
                } else {
                    var compressHandle = function(raw, statusCode, reasonPhrase) {
                        var stream = raw;
                        response.writeHead(statusCode, reasonPhrase);
                        stream.pipe(response);
                    };

                    var raw = fs.createReadStream(realPath);
                    compressHandle(raw, 200);
                }
            }
        });
    };
});

worker.ready(function(socket, which) {
    s.emit('connection', socket);
});

worker.on('suicide', function(by) {
    logger_asset.info('suicide by ' + by);
});

process.on('uncaughtException', function(err) {
    logger_asset.error('Caught Exception:' + err);
});
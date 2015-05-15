var worker = require('pm').createWorker();
var logger_asset = require('./logger').asset;
var url = require('url');
var fs = require('fs');
var path = require('path');
var mime = require('../config/mime').types;
var config = require('../config/config');
var utils = require('../util/utils');
var ItemProvider = require('./ItemProvider').ItemProvider;
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID
var Readable = require('stream').Readable;

process.on('uncaughtException', function(err) {
    logger_asset.error('Caught Exception:' + err);
});

process.on('exit', function (code) {
    mongodb.close();
});

process.on('SIGINT', function (code) {
    process.exit(0);
});

var mongodb = new Db(config.Common.MONGODB.database, new Server(config.Common.MONGODB.host, config.Common.MONGODB.port,
    {auto_reconnect:true, poolSize:config.Common.MONGODB.poolSize}));

var itemProvider = new ItemProvider(mongodb);

mongodb.open(function(err) {
    if (err) {
        logger_asset.error(err);
        process.exit(-1);
    }

    worker.ready(function(socket, which) {
        s.emit('connection', socket);
    });

    worker.on('suicide', function(by) {
        logger_asset.info('suicide by ' + by);
    });


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
            var realPath = config.Common.ASSET_PATH + url + '/';
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
                case 'query_screen_dump_set':
                    try {
                        var obj = JSON.parse(buffer);
                        if (obj['host'] === undefined || obj['name'] === undefined || obj['start'] === undefined || obj['end'] === undefined) {
                            errHandle(response, 'data format error');
                            return;
                        }
                        query_screen_dump_set(obj);
                        return;
                    } catch (e) {
                        logger_asset.error('json parse error');
                        errHandle(response, 'data format error');
                        return;
                    }
                case 'query_screen_dump':
                    try {
                        var obj = JSON.parse(buffer);
                        if (obj['host'] === undefined || obj['name'] === undefined || obj['id'] === undefined) {
                            errHandle(response, 'data format error');
                            return;
                        }
                        query_screen_dump(obj);
                        return;
                    } catch (e) {
                        logger_asset.error('json parse error');
                        errHandle(response, 'data format error');
                        return;
                    }
                default:
                    errHandle(response, 'command error');
                    return;
            }
            pathHandle(realPath);
        });

        var query_screen_dump = function(obj) {
            var filter = {'_id': new ObjectID(obj['id'])};
            itemProvider.find(obj['host'] + '##' + obj['name'], filter, null, null, function (err, doc) {
                if(err){
                    logger_asset.error('mongodb find err:' + err);
                    errHandle(response, 'query error');
                } else {
                    if(doc.length === 0){
                        errHandle(response, 'screen dump does not exist');
                        return;
                    }

                    response.setHeader("Screen-Dump-ID", doc[0]._id);
                    response.setHeader('Content-Length', doc[0].imgData.length());
                    response.setHeader("Last-Modified", utils.formatTime(doc[0].ts));

                    var rs = new Readable;
                    rs.push(doc[0].imgData.value());
                    rs.push(null);
                    response.writeHead(200, {'Content-Type': doc[0].type});
                    rs.pipe(response);
                }
            });
        };

        var query_screen_dump_set = function(obj) {
            var filter = {'ts': {$gte: new Date(obj['start']), $lte: new Date(obj['end'])}};
            var sort = {'sort': [['ts', obj['sort'] || -1]]};
            var col = {'_id':1};
            itemProvider.find(obj['host'] + '##' + obj['name'], filter, col, sort, function (err, doc) {
                if(err){
                    logger_asset.error('mongodb find err:' + err);
                    errHandle(response, 'query error');
                } else {
                    var idAry = [];
                    for(var i = 0; i < doc.length; i++){
                        idAry.push(doc[i]._id);
                    }

                    response.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
                    response.end(JSON.stringify({id_list: idAry}));
                }
            });
        };

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
                        var opt = { flags: 'r', encoding: null,fd: null, mode: 0666, autoClose: true};
                        var raw = fs.createReadStream(realPath, opt);
                        compressHandle(raw, 200);
                    }
                }
            });
        };
    });
});
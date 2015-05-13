var path = require('path');

exports.Expires = {
    fileMatch: /^(gif|bmp|png|jpg|js|css)$/ig,
    maxAge: 5
};
exports.Compress = {
    match: /css|html/ig
};
exports.Default = {
    file: 'index.html',
    screen_file: 'screen_default.jpg',
    device_file: 'virtual_list.json'
};
exports.Timeout = 20 * 60 * 1000;
exports.Secure = null;

exports.Common = {
    LOG_PATH: path.dirname(__dirname) + '/logs/log',
    ASSET_LISTEN: 1200,
    ASSET_PATH: path.dirname(__dirname) + '/assets/',
    MONGODB: {
        host			: '192.168.3.134',
        port			: 27017,
        database        : 'screen_dump',
        poolSize		: 5,
        collection_size : 2048000,
        collection_max	: 50000
    }
};
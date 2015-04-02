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

exports.Config = {
    LOG_PATH: path.dirname(__dirname) + '/logs/log',
    ASSET_LISTEN: 1200,
    ASSET_PATH: path.dirname(__dirname) + '/assets/'
};
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
    device_file: 'device__default_list.xml'
};
exports.Timeout = 20 * 60 * 1000;
exports.Secure = null;

exports.Config = {
    LOG_PATH:  process.cwd()  +  '/logs/log',
    ASSET_LISTEN: 1200
};
exports.Expires = {
    fileMatch: /^(gif|bmp|png|jpg|js|css)$/ig,
    maxAge: 60*60*24*365
};
exports.Compress = {
    match: /css|html/ig
};
exports.Default = {
	file: "index.html",
    screen_file: "screen_default.jpg",
    device_file: "device__default_list.xml"
};
exports.Timeout = 20 * 60 * 1000;
exports.Secure = null;
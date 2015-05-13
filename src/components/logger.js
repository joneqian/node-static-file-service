var log4js = require('log4js');
var config = require('../config/config');

log4js.configure({
  appenders: [{
    type: 'console'
  }, {
    type: 'file',
    filename: config.Common.LOG_PATH,
    pattern: '_yyyy-MM-dd',
    maxLogSize: 20480,
    alwaysIncludePattern: false,
    backups: 10,
    category: ['normal', 'asset']
  }],
  replaceConsole: false
});

log4js.getLogger('normal').setLevel('DEBUG');
log4js.getLogger('asset').setLevel('DEBUG');
//log4js.getLogger('normal').setLevel('INFO');
//log4js.getLogger('asset').setLevel('INFO');

module.exports.normal = log4js.getLogger('normal');
module.exports.asset = log4js.getLogger('asset');
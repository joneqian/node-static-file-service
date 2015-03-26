var logger_normal = require('./components/logger').normal;
var config = require('./config/config');

global.ASSET_LISTEN = config.Config.ASSET_LISTEN;

if (process.argv.length  === 3) {
	var arg2 = process.argv[2];

	if (arg2 == "help") {
		console.log("static file service command:");
		console.log("help: node main.js help");
		console.log("run server: node main.js [port]  ----  the default port is " + config.Config.ASSET_LISTEN);
		process.exit(0);
	} else if (isNaN(Number(arg2))) {
		console.log("Unknown command.Plese run 'node main.js help' .");
		process.exit(0);
	} else {
		global.ASSET_LISTEN = Number(arg2);
	}
}

if (process.argv.length > 3) {
	console.log("Too many arguments given.");
	console.log("Use 'node main.js help'.");
	process.exit(0);
};


var app = require('pm').createMaster({
	'pidfile':  __dirname +  'static-file-service.pid',
	'statusfile':  __dirname + 'status.log'
});

app.on('giveup', function(name, fatals, pause) {
	// YOU SHOULD ALERT HERE!
	logger_normal.info('[%s] [master:%s] giveup to restart "%s" process after %d times. pm will try after %d ms.',
		new Date(), process.pid, name, fatals, pause);
});

app.on('disconnect', function(name, pid) {
	var w = app.fork(name);
	logger_normal.error('[%s] [master:%s] worker:%s disconnect! new worker:%s fork',
		new Date(), process.pid, pid, w.process.pid);
});

app.on('fork', function(name, pid) {
	logger_normal.info('[%s] [master:%s] new %s:worker:%s fork',
		new Date(), process.pid, name, pid);
});

app.on('quit', function(name, pid, code, signal) {
	logger_normal.info('[%s] [master:%s] %s:worker:%s quit, code: %s, signal: %s',
		new Date(), process.pid, name, pid, code, signal);
});

app.register('assetService', __dirname + '/components/asset.js', {
	'listen': [global.ASSET_LISTEN],
	'children': 2
});


app.dispatch();
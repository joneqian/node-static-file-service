/**
 * Created by qianqing on 14-3-24.
 */
var ByteBuffer = require('./ByteBuffer');
var utils = require('./utils');

var package = module.exports;

/*
 * check and invoke callback function
 * */
package.pack = function(commandID,context,cb){
    //console.log('pack:'+context);
    if(!commandID || !context ||  !cb  || typeof commandID !== 'number' || typeof cb !== 'function'){
        utils.invokeCallback(cb, new Error('pack parameter error.'));
        return;
    }

    var bytebuf = new ByteBuffer().encoding('utf8').bigEndian();

    var buf_len = Buffer.byteLength(context);
    var buf = new Buffer(buf_len);
    buf.write(context);

    var packet_len  = buf_len + 2 + 2;
    var sendbuf = bytebuf.ushort(packet_len).ushort(commandID).byteArray(buf,buf_len).pack();

    utils.invokeCallback(cb, null,sendbuf);
    return;
};


package.unpack = function(data,cb){
    if(!data || !cb || typeof cb !== 'function'){
        utils.invokeCallback(cb, new Error('unpack parameter error.'));
        return;
    }

    var bytebuf = new ByteBuffer(data).encoding('utf8').bigEndian();

    var len = data.length - 2;
    var resArr = bytebuf.ushort().byteArray(null,len).unpack();

    var context = new Buffer(resArr[1]);
    utils.invokeCallback(cb, null,resArr[0],context.toString());
    return;
};
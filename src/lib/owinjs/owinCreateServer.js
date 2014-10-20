if (global.Browser)
{
    exports = module.exports = global.Browser;
    return;
}

var owinHttp = require('./owinHttp.js');
var http = require('http');
var path = require('path');

/**
 * Main method to create a browser-based OWIN/JS server
 *
 * @method createOwinServer
 * @param appFunc  = (promise) function(OwinContext) the OWIN/JS application function
 * @param appId (string) = unique identifier for the OWIN/JS application being created
 * @returns server (object) = the owinServer object which exposes a public listen method
 * @public
 */
exports.createServer = function createServer(appFunc, appId) {
    var server = {};
    server.http = http.createServer(owinHttp(appFunc));
    
    process.package = require(path.join(process.cwd(),'package.json'));
    server.listen = OwinServerListen;
    return server;
};

/**
 * Method exposed on OwinServer object to start the browser window
 *
 * @method listen
 * @param url  = (string) the  url with which  the browser is opened; default = node://localhost/
 * @param title (string) = the window title
 * @param x (int) = the width of the initial browser window
 * @param t (int) = the height of the initial browser window
 * @returns (void)
 * @public
 */
function OwinServerListen(url, title, x, y) {
    
    if (url == 'hidden')
        return;
    
    this.http.listen();
    var port = this.http.address().port;
    
    if (!url)
    {
        url = process.package["node-baseurl"]+process.package["node-main"];
        x=process.package.window.width;
        y=process.package.window.height;
        title=process.package.window.title;
    }
    
    url = url.replace('node://localhost/', 'http://localhost:' + port + '/');
    url = url.replace('node://localhost/', 'http://localhost:' + port + '/');
    
    console.log("OPENING DEFAULT BROWSER FOR " + url);
    
    var spawn = require('child_process').spawn;
    spawn('open', [url]);
    
}


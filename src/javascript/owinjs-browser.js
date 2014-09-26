// Module dependencies
var owinserver = require('owinserver.js');

/**
 * Main method to create a browser-based OWIN/JS server
 *
 * @method createOwinServer
 * @param appFunc  = (promise) function(owinContext) the OWIN/JS application function
 * @param appId (string) = unique identifier for the OWIN/JS application being created
 * @returns server (object) = the owinServer object which exposes a public listen method
 * @public
 */
exports.createServer = function createServer(appFunc, appId) {
    var server = owinserver.createOwinServer(appFunc, appId);
    server.listen = OwinServerListen;
    return server;
}

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
    
               if (!url)
               {
               url = process.package['node-baseurl']+process.package['node-main'];
               x=process.package.window.width;
               y=process.package.window.height;
               title=process.package.window.title;
               }
               if (url == "hidden")
               return;
    
              setTimeout(function(){
               process.createWindow(url, title, x, y);
               }, (process.package["node-splashtime"] || 1000));
              
}


var owinjs = require('owinjs');
var router = require('owinjs-router');
var owinStatic = require('owinjs-static');
var razor = require('owinjs-razor');
var route = router();
var path = require('path');

var app = new owinjs.app();

app.use(route);
app.use(owinStatic('./', {sync:true}));
app.mount('/bootflat', function(applet){
    applet.use(owinStatic(path.resolve(__dirname, 'node_modules/bootflat'), {sync:true}));
});
app.mount('/public', function(applet){
          applet.use(owinStatic(path.resolve(__dirname, 'public'), {sync:true}));
          });

route.get('/', function routeGetDefault(){
    console.log("GET: " +this.request.path);
    var fileName = 'index.js.html';
          
    return  razor.renderViewAsync(this, fileName, path.resolve(__dirname, 'views') + '/');
});

var server = io.nodekit.createServer(app.buildHttp());
server.listen(8000,"localhost");

console.log('Server started');
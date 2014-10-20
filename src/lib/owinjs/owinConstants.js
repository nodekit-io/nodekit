
exports.owin = {
    RequestScheme : "owin.RequestScheme",
    RequestMethod : "owin.RequestMethod",
    RequestPathBase : "owin.RequestPathBase",
    RequestPath : "owin.RequestPath",
    RequestQueryString : "owin.RequestQueryString",
    RequestProtocol : "owin.RequestProtocol",
    RequestHeaders : "owin.RequestHeaders",
    RequestBody : "owin.RequestBody",
    
    ResponseStatusCode : "owin.ResponseStatusCode",
    ResponseReasonPhrase : "owin.ResponseReasonPhrase",
    ResponseProtocol : "owin.ResponseProtocol",
    ResponseHeaders : "owin.ResponseHeaders",
    ResponseBody : "owin.ResponseBody",
 
    CallCancelled : "owin.CallCancelled",
    OwinVersion : "owin.Version"
};

exports.builder =
{
    AddSignatureConversion : "builder.AddSignatureConversion",
    DefaultApp : "builder.DefaultApp",
    DefaultMiddleware : "builder.DefaultMiddleware"

};

exports.commonkeys =
{
    ClientCertificate : "ssl.ClientCertificate",
    RemoteIpAddress : "server.RemoteIpAddress",
    RemotePort : "server.RemotePort",
    LocalIpAddress : "server.LocalIpAddress",
    LocalPort : "server.LocalPort",
    IsLocal : "server.IsLocal",
    TraceOutput : "host.TraceOutput",
    Addresses : "host.Addresses",
    AppName : "host.AppName",
    Capabilities : "server.Capabilities",
    OnSendingHeaders : "server.OnSendingHeaders",
    OnAppDisposing : "host.OnAppDisposing",
    Scheme : "scheme",
    Host : "host",
    Port : "port",
    Path : "path",
    AppId: "server.AppId",
    CallCancelledSource : "server.CallCancelledSource"
};

exports.sendfile =
{
    Version : "sendfile.Version",
    Support : "sendfile.Support",
    Concurrency : "sendfile.Concurrency",
    SendAsync : "sendfile.SendAsync"
};

exports.opaque =
{
    // 3.1. Startup
    
    Version : "opaque.Version",
    
    // 3.2. Per Request
    
    Upgrade : "opaque.Upgrade",
    
    // 5. Consumption
    
    Stream : "opaque.Stream",
    CallCancelled : "opaque.CallCancelled",
};

exports.websocket =
{
    // 3.1. Startup
    Version : "websocket.Version",
    
    // 3.2. Per Request
    Accept : "websocket.Accept",
    
    // 4. Accept
    SubProtocol : "websocket.SubProtocol",
    
    // 5. Consumption
    SendAsync : "websocket.SendAsync",
    ReceiveAsync : "websocket.ReceiveAsync",
    CloseAsync : "websocket.CloseAsync",
    CallCancelled : "websocket.CallCancelled",
    ClientCloseStatus : "websocket.ClientCloseStatus",
    ClientCloseDescription : "websocket.ClientCloseDescription"
};


exports.security =
{
    // 3.2. Per Request
    User : "server.User",
    Authenticate : "security.Authenticate",
    
    // 3.3. Response
    SignIn : "security.SignIn",
    SignOut : "security.SignOut",
    Challenge : "security.Challenge"
};

exports.owinjs =
{
    Error : "owinjs.Error",
    setResponseHeader : "owinjs.SetResponseHeader",
    getResponseHeader : "owinjs.GetResponseHeader",
    removeResponseHeader : "owinjs.RemoveResponseHeader",
    writeHead : "owinjs.WriteHead",
    id: "owinjs.Id",
    getRequestHeader : "owinjs.GetRequestHeader"    
};


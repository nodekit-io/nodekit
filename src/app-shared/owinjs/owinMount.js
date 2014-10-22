var Promise = require('promise');

module.exports = mount;
var mountMappings = [];

/**
 * Middleware Function to mount owin Middleware or application at given server host or path location
 *
 * @param {String} location
 * @param {appFunc} OWIN/JS application to run at this mounting
 * @return {middleware function that can be inserted into main pipeline, or used as an appFunc}
 * @api public
 */

function mount(location, appFunc) {
    var host, path, match, pattern;

    // If the path is a fully qualified URL use the host as well.
    match = location.match(/^https?:\/\/(.*?)(\/.*)/);
    if (match) {
        host = match[1];
        path = match[2];
    } else {
        path = location;
    }

    if (path.charAt(0) !== '/')
    {
        throw new Error('Path must start with "/", was "' + path + '"');
    }

    path = path.replace(/\/$/, '');

    pattern = new RegExp('^' + escapeRegExp(path).replace(/\/+/g, '/+') + '(.*)');

    mountMappings.push({
        host: host,
        path: path,
        pattern: pattern,
        appFunc: appFunc
    });

    mountMappings.sort(byMostSpecific);

    return function owinMount(next){
        var owin, pathBase, pathInfo, host, mapping, match, remainingPath, i, len;
        
        owin = this;
      
        // response is already handled
        if (owin.response.statusCode !== null)
          {return;}

        pathBase = owin['owin.RequestPathBase'];
        pathInfo = owin['owin.RequestPath'];
        host = owin.request.host;
      
        len = mountMappings.length;
        for (i = 0;  i < len; ++i) {
            mapping = mountMappings[i];
  
            // Try to match the host.
            if (mapping.host && mapping.host !== host)
              { continue;}
       
            // Try to match the path.
            if (!(match = pathInfo.match(mapping.pattern)))
             { continue;}
       
            // Skip if the remaining path doesn't start with a "/".
            remainingPath = match[1];
            if (remainingPath.length > 0 && remainingPath[0] !== '/')
              { continue;}
       
            owin['owin.RequestPathBase'] = pathBase + mapping.path;
            owin['owin.RequestPath'] = remainingPath;

            return mapping.appFunc.call(owin, owin);
        }
        
        return next();
    };
}

function byMostSpecific(a, b) {
    return (b.path.length - a.path.length) || ((b.host || '').length - (a.host || '').length);
}

function escapeRegExp(string) {
    return String(string).replace(/([.?*+^$[\]\\(){}-])/g, '\\$1');
}

/*
 * Copyright (c) 2016 OffGrid Networks;  Portions copyright 2014 Red Hat
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var util = require('util');
var nativeDNS = require('platform').DNS;

var cares = {};

cares.isIP = function(host) {
    if ( ! host ) {
        return false;
    }
    if ( host.match( "^[0-9][0-9]?[0-9]?\\.[0-9][0-9]?[0-9]?\\.[0-9][0-9]?[0-9]?\\.[0-9][0-9]?[0-9]?$" ) ) {
        return 4;
    }
    
    return 0;
}
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------

function translateError(err) {
    
    switch (err) {
        case "ADDRFAMILY":
            return process.binding('uv').UV_EAI_ADDRFAMILY
        case "AGAIN":
            return process.binding('uv').UV_EAI_AGAIN
        case "BADFLAGS":
            return process.binding('uv').UV_EAI_BADFLAGS
        case "CANCELED":
            return process.binding('uv').UV_EAI_CANCELED
        case "FAIL":
            return process.binding('uv').UV_EAI_FAIL
        case "FAMILY":
            return process.binding('uv').UV_EAI_FAMILY
        case "NODATA":
            return process.binding('uv').UV_EAI_NODATA
        case "NONAME":
            return process.binding('uv').UV_EAI_NONAME
        case "OVERFLOW":
            return process.binding('uv').UV_EAI_OVERFLOW
        case "SERVICE":
            return process.binding('uv').UV_EAI_SERVICE
        case "BADHINTS":
            return process.binding('uv').UV_EAI_BADHINTS
        case "PROTOCOL":
            return process.binding('uv').UV_EAI_PROTOCOL
        default:
            return err;
    }
}

// ----------------------------------------------------------------------
// getaddrinfo
// ----------------------------------------------------------------------

cares.getaddrinfo = function(req,name,family) {
    
    if (name == "localhost")
    {
        req.oncomplete(undefined, ["127.0.0.1"], 4);
        return;
    }
    if (name == "nodyn.io")
    {
        req.oncomplete(undefined, ["199.193.199.40"], 4);
        return;
    }
    
    var callback = function(err, result) {
        if (err ) {
            req.oncomplete( translateError( err ) );
        } else {
            req.oncomplete( undefined, [ result.hostAddress ], result.family );
        }
    };
    
    if ( family === 4 ) {
        nativeDNS.GetAddrInfo4(name, callback);
    } else if (family === 6 ) {
        nativeDNS.GetAddrInfo6(name, callback);
    } else {
        nativeDNS.GetAddrInfo(name, callback);
    }
}


// ----------------------------------------------------------------------
// A
// ----------------------------------------------------------------------

cares.queryA = function(req,name) {
    nativeDNS.QueryA(name, function(err, result) {
                         if ( err ) {
                            req.oncomplete( err );
                         } else {
                         var a = [];
                         result.forEach(function(item) {
                                        a.push(item.hostAddress)
                                        });
                         req.oncomplete(undefined, a);
                         }
                         });
}


// ----------------------------------------------------------------------
// AAAA
// ----------------------------------------------------------------------

cares.queryAaaa = function(req,name) {
    nativeDNS.QueryAaaa(name, function(err, result) {
                        if ( err ) {
                        req.oncomplete( err );
                        } else {
                        var a = [];
                        result.forEach(function(item) {
                                       a.push(item.hostAddress)
                                       });
                        req.oncomplete(undefined, a);
                        }
                        });
}

// ----------------------------------------------------------------------
// MX
// ----------------------------------------------------------------------

cares.queryMx = function(req,name) {
    nativeDNS.QueryMx(name, function(err, result) {
                      if ( err ) {
                      req.oncomplete( err );
                      } else {
                      var a = [];
                      result.forEach(function(item) {
                                     a.push( {
                                            exchange: item.name,
                                            priority: item.priority,
                                            } );
                                     });
                      req.oncomplete(undefined, a);
                      }
                      });
}

// ----------------------------------------------------------------------
// TXT
// ----------------------------------------------------------------------

cares.queryTxt = function(req,name) {
    nativeDNS.QueryTxt(name,  function(err, result) {
                       if ( err ) {
                       req.oncomplete( err );
                       } else {
                       var a = [];
                       result.forEach(function(item) {
                                      a.push(item)
                                      });
                       req.oncomplete(undefined, a);
                       }
                       });}

// ----------------------------------------------------------------------
// SRV
// ----------------------------------------------------------------------

cares.querySrv = function(req,name) {
    nativeDNS.QuerySrv(name,  function(err, result) {
                       if ( err ) {
                       req.oncomplete( err );
                       } else {
                       var a = [];
                       result.forEach(function(item) {
                                      a.push( {
                                             name:     item.target,
                                             port:     item.port,
                                             priority: item.priority,
                                             weight:   item.weight,
                                             } );
                                      });
                       req.oncomplete(undefined, a);
                       }
                       });
}

// ----------------------------------------------------------------------
// NS
// ----------------------------------------------------------------------

cares.queryNs = function(req,name) {
    nativeDNS.queryNs(name,  function(err, result) {
                       if ( err ) {
                       req.oncomplete( err );
                       } else {
                       var a = [];
                       result.forEach(function(item) {
                                      a.push( item );
                                      });
                       req.oncomplete(undefined, a);
                       }
                       });
}

// ----------------------------------------------------------------------
// CNAME
// ----------------------------------------------------------------------

cares.queryCname = function(req,name) {
    nativeDNS.queryCname(name,  function(err, result) {
                      if ( err ) {
                      req.oncomplete( err );
                      } else {
                      var a = [];
                      result.forEach(function(item) {
                                     a.push( item );
                                     });
                      req.oncomplete(undefined, a);
                      }
                      });
}

// ----------------------------------------------------------------------
// Reverse
// ----------------------------------------------------------------------

cares.getHostByAddr = function(req,name) {
    nativeDNS.GetHostByAddr(name,  function(err, result) {
                         if ( err ) {
                         req.oncomplete( err );
                         } else {
                             req.oncomplete(undefined, result.hostName);
                         }
                         });
}
// ----------------------------------------------------------------------

cares.GetAddrInfoReqWrap = function GetAddrInfoReqWrap(){}
cares.GetAddrInfoReqWrap = function GetNameInfoReqWrap(){}

module.exports = cares;
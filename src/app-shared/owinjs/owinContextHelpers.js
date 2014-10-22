/**
 * Adds alias property accessors to OWIN/JS context object for given OWIN/JS category
 *     (e.g., request.pathBase for fn({"owin.RequestPathBase": ""}, "owin.Request", context.request.prototype))
 *
 * @method refreshPrototype
 * @param propertyList (object)  a representative OWIN context with all desired properties set (to null, default or value)
 * @param owinPrefix (string)  the Owin  prefix to search for (e.g., "owin.Request")
 * @param owinObject (object)  the javascript object on which to add the prototypes (e.g., context.request)
 * @returns (void)
 * @internal
 */
exports.refreshPrototype = function(propertyList, owinPrefix, owinObjectPrototype)
{
    Object.keys(propertyList).forEach(function (_property)
                                      {
                                      var suffix = private_getSuffix(owinPrefix, _property);
                                      
                                      if (suffix)
                                      {
                                      if (suffix.length >1)
                                      var suffix = suffix.substring(0,1).toLowerCase() + suffix.substring(1)
                                      else
                                      suffix = suffix.toLowerCase();
                                      
                                      
                                      Object.defineProperty(owinObjectPrototype, suffix, {
                                                            
                                                            get: function () {
                                                            return this.context[_property];
                                                            },
                                                            
                                                            set: function (val) {
                                                            this.context[_property] = val;
                                                            }
                                                            
                                                            })
                                      }
                                      });
}

/**
 * Add alias properties to OWIN/JS Context object  (e.g., context.owinServer from "owin.Server")
 * NOT CURRENTLY USED
 *
 * @method refreshPrototypeOwinContext
 * @param owinObject (object) the Owin Context object on which to add the alias properties
 * @returns (void)
 * @internal
 */
exports.refreshPrototypeOwinContext =function(owinObject)
{
    var proto = owinObject.constructor.prototype;
    
    Object.keys(owinObject).forEach(function (_property)
                                    {
                                    
                                    var n = _property.indexOf(".");
                                    if (n>-1)
                                    {
                                    
                                    var short = _property.substring(0,n) + _property.substring(n+1);
                                    
                                    Object.defineProperty(proto, short, {
                                                          get: function () {
                                                          return this[_property];
                                                          },
                                                          
                                                          set: function (val) {
                                                          this[_property] = val;
                                                          }
                                                          
                                                          });
                                    }
                                    
                                    });
    
}

/**
 * Create alias access methods on context.response for context body elemeent for given stream/readable/writable prototype
 *
 * Note: the alias will be a collection of both functions (which simply shell out to target function) and valuetypes (which
 * have a getter and setter defined which each shell out to the target property)
 *
 * @method cloneBodyPrototypeAlias
 *
 * @param targetObjectPrototype (__proto__)  the prototype object for the context.response object on which the alias properties are set
 * @param sourceObjectprototype (__proto__)  the prototpye object for the generic stream/writable on which to enumerate all properties
 * @param owinContextKey (string) "owin.RequestBody" or "owin.ResponseBody"
 * @returns (void)
 * @internal
 */
exports.cloneBodyPrototypeAlias=function(targetObjectPrototype, sourceObjectprototype, owinContextKey)
{
    Object.getOwnPropertyNames(sourceObjectprototype).forEach(function (_property)
                                                              {
                                                              if (typeof( sourceObjectprototype[_property]) === 'function')
                                                              {
                                                              targetObjectPrototype[_property] = function(){
                                                              var body =this.context[owinContextKey];
                                                              return body[_property].apply(body, Array.prototype.slice.call(arguments));
                                                              };
                                                              }
                                                              else
                                                              {
                                                              Object.defineProperty(targetObjectPrototype, _property, {
                                                                                    
                                                                                    get: function () {
                                                                                    return this.context[owinContextKey][_property];
                                                                                    },
                                                                                    
                                                                                    set: function (val) {
                                                                                    this.context[owinContextKey][_property] = val;
                                                                                    }
                                                                                    
                                                                                    });
                                                              }
                                                              });
    
}

// PRIVATE METHODS

/**
 * Extract name from Owin Property
 *
 * @method private_getSuffix
 * @param prefix (string)  the prefix to search for (e.g., "owinRequest")
 * @param data (string)  the Owin Property (e.g., "owinRequestBody")
 * @returns (string)  the suffix if found (e.g., "owinRequestBody"), null if no match
 * @private
 */

function private_getSuffix(prefix, data) {
    if (data.lastIndexOf(prefix, 0) === 0)
        return data.substring(prefix.length);
    else
        return null;
}

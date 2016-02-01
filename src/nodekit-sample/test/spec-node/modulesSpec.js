var helper = require('./specHelper');

/*var System    = java.lang.System;
var userDir   = System.getProperty('user.dir');
var userHome  = System.getProperty('user.home');*/

var isWindows = process.platform === 'win32';
var fileSep   = '/';

require.root  =  "/test/spec-node";

var matchers = {
  toHaveModuleProperties: function(properties_file) {
    var mod = this.actual;

    if ( (typeof mod.id) != 'string' ) {
      this.message = function(){ return 'Expected typeof mod.id to be "string" but was ' + ( typeof mod.id ); };
      return false;
    }

    if ( mod.filename !== properties_file ) {
      this.message = function(){ 'Expected mod.filename to be ' + properties_file + ", but was " + mod.filename; };
      return false;
    }

    if ( (typeof mod.loaded) != 'boolean' ) {
      this.message = function(){ return 'Expected typeof mod.loaded to be "boolean" but was ' + ( typeof mod.loaded ); };
      return false;
    }

    if ( (typeof mod.parent) != 'object' ) {
      this.message = function(){ return 'Expected typeof mod.parent to be "object" but was ' + ( typeof mod.parent ); };
      return false;
    }

    if ( (typeof mod.parent.filename) != 'string' ) {
      this.message = function(){ return 'Expected typeof mod.parent.filename to be "string" byt was ' + ( typeof mod.parent.filename ); };
      return false;
    }

    if ((typeof mod.children) != 'object' ) {
      this.message = function(){ return 'Expected typeof mod.childrento be "object" byt was ' + ( typeof mod.children); };
      return false;
    }

    return true;
  }
};

describe( "modules", function() {

  it("should have mod.dirname", function() {
    var mod = require('./somemodule');
    expect(mod.dirname).not.toBe(null);
    expect(mod.dirname).not.toBe(undefined);
  });

  it("should have locate module's index.js", function() {
    var mod = require('./amodule');
    expect(mod.flavor).toBe("nacho cheese");
  });

  it("should find module's package.json", function() {
    var mod = require('./somemodule');
    expect(mod.flavor).toBe("cool ranch");
     });

  it("should find an load json files", function() {
    json = require('./conf.json');
    expect(json.somekey).toBe("somevalue");
  });

  it("should properly isolate", function() {
    require('./module-isolation/module-a.js');
    try {
      var shouldThrow = EventEmitter;
      expect(false).toBe(true);
    } catch (err) {
      expect(err instanceof ReferenceError).toBe(true);
    }
   })

});

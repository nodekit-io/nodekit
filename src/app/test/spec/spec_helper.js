window.require = function(lib) {
  if (lib === 'fs') {
    return { readFileSync: jasmine.createSpy('fs readFileSync') };
  } else if (lib === 'glob') {
    return { sync: jasmine.createSpy('glob sync') };
  } else if (lib === 'handlebars') {
    return { compile: jasmine.createSpy('handlebars compile') };
  } else if (lib === 'path') {
    return {
      join: function() {
        return Array.prototype.join.call(arguments, '/');
      }
    };
  } else if (lib === 'underscore') {
    return _;
  } else {
    throw new Error("No mock for " + lib);
  }
};

window.__dirname = 'ROOT'

module = {};


var jasmine = require('./index.js');

jasmine.run({
  files: {
    js: 'lib/util.js',
    spec: 'spec/*_spec.js',
    specHelper: [
      'node_modules/underscore/underscore.js',
      'spec/spec_helper.js'
    ]
  }
});

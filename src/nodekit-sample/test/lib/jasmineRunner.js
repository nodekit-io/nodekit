var path = require('path'),
util = require('util'),
glob = require('glob');

module.exports = Jasmine;
module.exports.JsonReporter = require('./jsonReporter');

function Jasmine(container, options) {
    
    options = options || {};
    var jasmineCore = require('jasmine-core');
   
    this.jasmine = jasmineCore.boot(jasmineCore);
    this.projectBaseDir = options.projectBaseDir || path.dirname(module.parent.filename);
    this.specFiles = [];
    this.env = this.jasmine.getEnv();
    this.reportersCount = 0;
    this.container = container;
    this.jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
}

Jasmine.prototype.addSpecFile = function(filePath) {
    this.specFiles.push(filePath);
};

Jasmine.prototype.addReporter = function(reporter) {
    this.env.addReporter(reporter);
    this.reportersCount++;
};

Jasmine.prototype.configureDefaultReporter = function(options) {
    
    var jsonReporter;
    
    var defaultOnComplete = function(passed) {
        console.log(jsonReporter.getJSReportAsString());
    };
    
    options.timer = new this.jasmine.Timer();
    
    options.print = options.print || function() {
        process.stdout.write(util.format.apply(this, arguments));
    };
    
    options.showColors = options.hasOwnProperty('showColors') ? options.showColors : false;
    
    options.onComplete = options.onComplete || defaultOnComplete;
    
    jsonReporter = new module.exports.JsonReporter(this.container, options);
    jsonReporter.onComplete = options.onComplete;
    
    this.addReporter(jsonReporter);
};

Jasmine.prototype.addMatchers = function(matchers) {
    this.jasmine.Expectation.addMatchers(matchers);
};

Jasmine.prototype.loadSpecs = function() {
    this.specFiles.forEach(function(file) {
                           
                           // DELETE CACHED VERSION FROM NODE CACHE TO FORCE JASMINE TO (RE)LOAD SPECS
                            var files = require.cache[file];
                           
                           if (typeof files !== 'undefined') {
                           for (var i in files.children) {
                           delete require.cache[files.children[i].id];
                           }
                           delete require.cache[file];
                           }
                           
                           require(file);
                           });
};

Jasmine.prototype.loadConfig = function(config) {
     var specDir = config.spec_dir;
    var jasmineRunner = this;
    jasmineRunner.specDir = config.spec_dir;
    
    if(config.helpers) {
        config.helpers.forEach(function(helperFile) {
                               var filePaths = glob.sync(path.join(jasmineRunner.projectBaseDir, jasmineRunner.specDir, helperFile));
                               filePaths.forEach(function(filePath) {
                                                 if(jasmineRunner.specFiles.indexOf(filePath) === -1) {
                                                 jasmineRunner.specFiles.push(filePath);
                                                 }
                                                 });
                               });
    }
    
    if(config.spec_files) {
         jasmineRunner.addSpecFiles(config.spec_files);
    }
};

Jasmine.prototype.addSpecFiles = function(files) {
    var jasmineRunner = this;
    
    files.forEach(function(specFile) {
                  var filePaths = glob.sync(path.join(jasmineRunner.projectBaseDir, jasmineRunner.specDir, specFile));
                  filePaths.forEach(function(filePath) {
                                    
                                    if(jasmineRunner.specFiles.indexOf(filePath) === -1) {
                                     jasmineRunner.specFiles.push(filePath);
                                    }
                                    });
                  });
};

Jasmine.prototype.execute = function(files) {
    if(this.reportersCount === 0) {
        this.configureDefaultReporter({});
    }
    
    if (files && files.length > 0) {
        this.specDir = '';
        this.specFiles = [];
        this.addSpecFiles(files);
    }
    
    this.loadSpecs();
    this.env.execute();
};

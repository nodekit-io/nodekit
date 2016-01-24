/*
 * Copyright (c) 2016 OffGrid Networks
 *
 * Portions Copyright (c) 2008-2014 Pivotal Labs
 * Portions Copyright (C) 2011-2014 Ivan De Marino
 * Portions Copyright (C) 2014 Alex Treppass
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

module.exports = exports = JsonReporter;

function JsonReporter(container, options) {
    
    this.getJSReport = function () {
        if (this.container.jsReport) {
            return this.container.jsReport;
        }
    };
    
    this.getJSReportAsString = function () {
        if (this.container.jsReport) {
            return JSON.stringify(container.jsReport);
        }
    };
    
    this.getD3ReportAsString = function() {
        
        if (this.container.jsReport) {
          //  reportJSON = {name: "d3",  children: [this.container.jsReport] };
            reportJSON = _clone(this.container.jsReport);
            reportJSON.type = "Test";
            reportJSON.description = "Overall";
        } else
            return "{}";
        
        JSONScrubber(reportJSON);
        
        return JSON.stringify(reportJSON);
    };
    
    var JSONScrubber = function (parent) {
        
         for (var childkey in parent) {
                   
            childvalue = parent[childkey];
          
             if (childkey === "suites")
             {
                 if (typeof(childvalue) === "object"){
                     if (Object.prototype.toString.call( childvalue ) === '[object Array]')
                         if (childvalue.length>0)
                         {
                             if (childvalue[0].description == "Jasmine__TopLevel__Suite")
                             {
                                 parent.suites = childvalue[0].suites;
                                 childvalue = childvalue[0].suites;
                             }
                         }
                 }
             };
             
            if (childvalue === null) {
                delete parent[childkey]
            } else if (Object.prototype.toString.call( childvalue ) === '[object Array]') {
              if (childvalue.length == 0) {  delete parent[childkey] }
              else  if (childkey == "specs" || childkey == "suites") {
                  if (childvalue.description == "Jasmine__TopLevel__Suite")
                      parent.children = childvalue.suites
                  else
                      parent.children = childvalue;
                  delete parent[childkey];
              }
            }
             
            if (typeof(childvalue) === "object"){
                 if (Object.prototype.toString.call( childvalue ) === '[object Array]')
                 {
                     childvalue.forEach(function(arraychild)
                                        {
                                        if (childkey == "specs")
                                          arraychild.type = "it"
                                        else if (childkey == "suites")
                                          arraychild.type = "Suite";
                                        
                                        if (childkey != "failures")
                                          JSONScrubber(arraychild);
                                        });
                 }
                 else {
                     JSONScrubber(childvalue);
                 }
            }
        }
    };
    
    var onComplete = options.onComplete || function() {},
    specCount,
    failureCount,
    failedSpecs = [],
    pendingCount,
    failedSuites = [];
    
    this.specs  = {};
    this.suites = {};
    this.rootSuites = [];
    this.suiteStack = [];
    
    // export methods under container namespace
    container.getJSReport = this.getJSReport.bind(this);
    container.getJSReportAsString = this.getJSReportAsString.bind(this);
    container.getD3ReportAsString = this.getD3ReportAsString.bind(this);
    
    this.container = container;
    
    this.jasmineStarted = function() {
        specCount = 0;
        failureCount = 0;
        pendingCount = 0;
        timer = new Timer().start();
    };
    
    this.suiteStarted = function (suite) {
        suite = this._cacheSuite(suite);
        suite.specs = [];
        suite.suites = [];
        suite.passed = true;
        suite.parentId = this.suiteStack.slice(this.suiteStack.length -1)[0];
        if (suite.parentId) {
            this.suites[suite.parentId].suites.push(suite);
        } else {
            this.rootSuites.push(suite.id);
        }
        this.suiteStack.push(suite.id);
        suite.totalCount = 0;
        suite.passedCount = 0;
        suite.failedCount = 0;
        suite.timer = new Timer().start();
    };
    
    
    this.specStarted = function (spec) {
        spec = this._cacheSpec(spec);
        spec.timer = new Timer().start();
        spec.suiteId = this.suiteStack.slice(this.suiteStack.length -1)[0];
        this.suites[spec.suiteId].specs.push(spec);
    };
    
    this.specDone = function(spec) {
        spec = this._cacheSpec(spec);
        
        spec.duration = spec.timer.elapsed();
        spec.durationSec = spec.duration / 1000;
        
        spec.skipped = spec.status === 'pending';
        spec.passed = spec.skipped || spec.status === 'passed';
        
        spec.totalCount = spec.passedExpectations.length + spec.failedExpectations.length;
        spec.passedCount = spec.passedExpectations.length;
        spec.failedCount = spec.failedExpectations.length;
        spec.failures = [];
        
        for (var i = 0, j = spec.failedExpectations.length; i < j; i++) {
            var fail = spec.failedExpectations[i];
            spec.failures.push({
                               type: 'expect',
                               expected: fail.expected,
                               passed: false,
                               message: fail.message,
                               matcherName: fail.matcherName,
                         //      trace: {
                          //     stack: fail.stack
                          //     }
                               });
        }
        
        // maintain parent suite state
        var parent = this.suites[spec.suiteId];
        if (spec.failed) {
            parent.failingSpecs.push(spec);
        }
        parent.passed = parent.passed && spec.passed;
        parent.totalCount = parent.totalCount + 1;
        
        if (spec.passed)
            parent.passedCount = parent.passedCount + 1
        else
            parent.failedCount = parent.failedCount + 1;
        
        // keep report representation clean
        delete spec.timer;
        delete spec.totalExpectations;
        delete spec.passedExpectations;
        delete spec.suiteId;
        delete spec.fullName;
        delete spec.id;
        delete spec.status;
        delete spec.failedExpectations;
    };
    
    this.suiteDone = function(suite) {
        
        suite = this._cacheSuite(suite);
        suite.duration = suite.timer.elapsed();
        suite.durationSec = suite.duration / 1000;
        this.suiteStack.pop();
        
        // maintain parent suite state
        var parent = this.suites[suite.parentId];
        if (parent) {
            parent.passed = parent.passed && suite.passed;
            
            parent.totalCount = parent.totalCount + suite.totalCount;
            
                parent.passedCount = parent.passedCount + suite.passedCount;
                 parent.failedCount = parent.failedCount + suite.failedCount;
            
        }
        
        // keep report representation clean
        delete suite.timer;
        delete suite.id;
        delete suite.parentId;
        delete suite.fullName;
    };

    
    this.jasmineDone = function() {
        this._buildReport();
        onComplete();
    };
 
    
    /*
     Utility methods
     */
    var _extend = function (obj1, obj2) {
        for (var prop in obj2) {
            obj1[prop] = obj2[prop];
        }
        return obj1;
    };
    
    var _clone = function (obj) {
        if (obj !== Object(obj)) {
            return obj;
        }
        return _extend({}, obj);
    };
    
    // Private methods
    // ---------------
    
    this._haveSpec = function (spec) {
        return this.specs[spec.id] != null;
    };
    
    this._cacheSpec = function (spec) {
        var existing = this.specs[spec.id];
        if (existing == null) {
            existing = this.specs[spec.id] = _clone(spec);
        } else {
            _extend(existing, spec);
        }
        return existing;
    };
    
    this._haveSuite = function (suite) {
        return this.suites[suite.id] != null;
    };
    
    this._cacheSuite = function (suite) {
        
        var existing = this.suites[suite.id];
        if (existing == null) {
            existing = this.suites[suite.id] = _clone(suite);
        } else {
            _extend(existing, suite);
        }
        return existing;
    };
    
    this._buildReport = function () {
        var overallDuration = 0;
        var overallPassed = true;
        var overallSuites = [];
        
        var overallTotalCount = 0;
        var overallPassedCount = 0;
        var overallFailedCount = 0;
        
        
        for (var i = 0, j = this.rootSuites.length; i < j; i++) {
            var suite = this.suites[this.rootSuites[i]];
            overallDuration += suite.duration;
            overallTotalCount += suite.totalCount;
            overallPassedCount += suite.passedCount;
            overallFailedCount += suite.failedCount;
            overallPassed = overallPassed && suite.passed;
            overallSuites.push(suite);
        }
        
        this.container.jsReport = {
        passed: overallPassed,
        totalCount: overallTotalCount,
        passedCount: overallPassedCount,
        failedCount: overallFailedCount,
        durationSec: overallDuration / 1000,
        suites: overallSuites
        };
    };
    
    var Timer = function () {};
    
    Timer.prototype.start = function () {
        this.startTime = new Date().getTime();
        return this;
    };
    
    Timer.prototype.elapsed = function () {
        if (this.startTime == null) {
            return -1;
        }
        return new Date().getTime() - this.startTime;
    };

};
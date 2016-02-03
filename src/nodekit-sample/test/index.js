var BrowserWindow = require('electro').BrowserWindow;
var app = require('electro').app;

console.log('STARTING TEST APPLICATION');

app.on('ready', function(){
       var jasmine = require('./server.js');
       var p = new BrowserWindow({'preloadURL': 'file://' + __dirname + '/public/index.html'});
       
       jasmine.run(
                   {
                   'spec_dir': 'spec-node',
                   'spec_files': [
                                  'assertSpec.js',
                                  'consoleSpec.js',
                                  'cryptoHashSpec.js',
                                  'cryptoRandomSpec.js',
                                  'cryptoHmacSpec.js',
                                  'cryptoPbkdf2Spec.js',
                                  'cryptoSignCommonSpec.js',
                                  'dgramSpec.js', 
                                  'fsSpec.js',
                                  'globalSpec.js',
                                  'modulesSpec.js',
                                  'osSpec.js',
                                  'pathSpec.js',
                                  'queryStringSpec.js',
                                  'streamBigPacketSpec.js',
                                  'streamDuplexSpec.js',
                                  'streamEndPauseSpec.js',
                                  'streamPipeAfterEndSpec.js',
                                  'streamPipeCleanupSpec.js',
                                  'streamPipeErrorHandlingSpec.js',
                                  'streamPipeEventSpec.js',
                                  'streamTransformSpec.js',
                                  'stringDecoderSpec.js',
                                  'urlSpec.js',
                                  'utilSpec.js',
                                  'zlibSpec.js',
                                  /* 'timersSpec.js',  uncomment for time-intensive tests, excluded for performance benchmarks */
                                  'netServerSpec.js' ,
                                  'tcpSpec.js',
                                  'httpAgentSpec.js',
                                  'httpClientSpec.js',
                                       'httpSpec.js',    
                                  ],
                   'spec_todo': [
                                 'netPauseSpec.js',
                                 'bufferSpec.js',
                                 'childProcessSpec.js',
                                 'clusterSpec.js',
                                 'cryptoCipherSpec.js',
                                 'cryptoDHSpec.js',
                                 'cryptoSignSpec.js',
                                 'dnsSpec.js',
                                 'fsStatSpec.js',
                                 'fsStreamSpec.js',
                                 'fsWatchSpec.js',
                                 'processSpec.js',
                                 'tlsSpec.js',
                                 'vmSpec.js',
                                 
                                 ],
                   
                            'helpers': ['specHelper.js',
                               'helpers/*.js'
                               ]
                   }
                   );
       

       })

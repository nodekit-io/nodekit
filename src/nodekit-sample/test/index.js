var BrowserWindow = require('electro').BrowserWindow;
var app = require('electro').app;

console.log('STARTING TEST APPLICATION');

app.on('ready', function(){
      //    var result = io.nodekit.test.alertSync('hello');
       //      io.nodekit.test.logconsole('hello' + result);
       //     p.webContents.send('hello world')
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
                     //     'dgramSpec.js',
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
                                  /*   'timersSpec.js',  uncomment for full tests */
                                  
                                'netServerSpec.js' ,
                                 'tcpSpec.js',
                             'httpAgentSpec.js',
                                   'httpClientSpec.js',
                           //     'httpSpec.js',
                             //     'netPauseSpec.js',
                          
                          
                     
                                  
                                  
                           
                                  ],
                   'spec_todo': [
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
                   
                   'spec_files2': [
                                   'assertSpec.js',
                                   'bufferSpec.js',
                                   'childProcessSpec.js',
                                   'clusterSpec.js',
                                   'consoleSpec.js',
                                   'cryptoCipherSpec.js',
                                   'cryptoDHSpec.js',
                                   'cryptoHashSpec.js',
                                   'cryptoHmacSpec.js',
                                   'cryptoPbkdf2Spec.js',
                                   'cryptoRandomSpec.js',
                                   'cryptoSignCommonSpec.js',
                                   'cryptoSignSpec.js',
                                   'dgramSpec.js',
                                   'dnsSpec.js',
                                   'fsSpec.js',
                                   'fsStatSpec.js',
                                   'fsStreamSpec.js',
                                   'fsWatchSpec.js',
                                   'globalSpec.js',
                                   'httpAgentSpec.js',
                                   'httpClientSpec.js',
                                   'httpSpec.js',
                                   'modulesSpec.js',
                                   'netPauseSpec.js',
                                   'netServerSpec.js' ,
                                   'osSpec.js',
                                   'pathSpec.js',
                                   'processSpec.js',
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
                                   'timersSpec.js',
                                   'tlsSpec.js',
                                   'urlSpec.js',
                                   'utilSpec.js',
                                   'vmSpec.js',
                                   'zlibSpec.js'
                                   ],
                   'helpers': ['specHelper.js',
                               'helpers/*.js'
                               ]
                   }
                   );
       

       })





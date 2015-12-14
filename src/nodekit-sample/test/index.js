
var jasmine = require('test/server.js');

jasmine.run(
              {
              "spec_dir": "spec-node",
            "spec_files": [
                           "assertSpec.js",
                           "consoleSpec.js",
                           
                             "cryptoPbkdf2Spec.js",
                           "cryptoSignCommonSpec.js",
                           
                           "fsSpec.js",
                           "httpAgentSpec.js",
                           "httpSpec.js",
                           "netPauseSpec.js",
                           "netServerSpec.js" ,
                           "osSpec.js",
                           "pathSpec.js",
                           "queryStringSpec.js",
                           "streamBigPacketSpec.js",
                           "streamDuplexSpec.js",
                           "streamEndPauseSpec.js",
                           "streamPipeAfterEndSpec.js",
                           "streamPipeCleanupSpec.js",
                           "streamPipeErrorHandlingSpec.js",
                           "streamPipeEventSpec.js",
                           "streamTransformSpec.js",
                           "stringDecoderSpec.js",
                           "timersSpec.js",
                           "urlSpec.js",
                           "utilSpec.js",
                           "zlibSpec.js"
                           
                           
                        /*  "*[sS]pec.js"*/
                           ],
            "spec_todo": [
                           "bufferSpec.js",
                          "childProcessSpec.js",
                          "clusterSpec.js",
                          "cryptoCipherSpec.js",
                          "cryptoDHSpec.js",
                          "cryptoHashSpec.js",
                          "cryptoHmacSpec.js",
                          "cryptoRandomSpec.js",
                          "cryptoSignSpec.js",
                          "dnsSpec.js",
                          "dgramSpec.js",
                          "fsStatSpec.js",
                          "fsStreamSpec.js",
                          "fsWatchSpec.js",
                          "globalSpec.js",
                          "httpClientSpec.js",
                          "modulesSpec.js",
                          "processSpec.js",
                          "tlsSpec.js",
                          "vmSpec.js",
                          
                                     ],

              "spec_files2": [
                              "assertSpec.js",
                              "bufferSpec.js",
                              "childProcessSpec.js",
                              "clusterSpec.js",
                              "consoleSpec.js",
                              "cryptoCipherSpec.js",
                              "cryptoDHSpec.js",
                              "cryptoHashSpec.js",
                              "cryptoHmacSpec.js",
                              "cryptoPbkdf2Spec.js",
                              "cryptoRandomSpec.js",
                              "cryptoSignCommonSpec.js",
                              "cryptoSignSpec.js",
                              "dgramSpec.js",
                              "dnsSpec.js",
                              "fsSpec.js",
                              "fsStatSpec.js",
                              "fsStreamSpec.js",
                              "fsWatchSpec.js",
                              "globalSpec.js",
                              "httpAgentSpec.js",
                              "httpClientSpec.js",
                              "httpSpec.js",
                              "modulesSpec.js",
                              "netPauseSpec.js",
                              "netServerSpec.js" ,
                              "osSpec.js",
                              "pathSpec.js",
                              "processSpec.js",
                              "queryStringSpec.js",
                              "streamBigPacketSpec.js",
                              "streamDuplexSpec.js",
                              "streamEndPauseSpec.js",
                              "streamPipeAfterEndSpec.js",
                              "streamPipeCleanupSpec.js",
                              "streamPipeErrorHandlingSpec.js",
                              "streamPipeEventSpec.js",
                              "streamTransformSpec.js",
                              "stringDecoderSpec.js",
                              "timersSpec.js",
                                 "tlsSpec.js",
                              "urlSpec.js",
                              "utilSpec.js",
                              "vmSpec.js",
                              "zlibSpec.js"
                           /*  "*[sS]pec.js" */
                             ],
              "helpers": ["specHelper.js",
                          "helpers/*.js"
                          ]
              }
);


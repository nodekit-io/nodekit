var helper = require('./specHelper'),
util = require('util'),
fs = require('fs');

describe("fs module", function() {
         
         var tmpFile,
         basedir,
         data = 'now is the winter of our discontent made glorious summer',
         tempDir = io.nodekit.platform.fs.getTempDirectorySync();
         
         beforeEach(function() {
                    tmpFile = new helper.File(tempDir + "/pork-recipes.txt");
                    basedir = tempDir;
                      });
         
         afterEach(function() {
                   tmpFile.delete();
                   });
         
         it("should have a mkdirSync() function", function(){
            var newDirectory = new helper.Directory(basedir + "/waffle-recipes");
            newDirectory.delete();
            expect(newDirectory.exists()).toBe(false);
            expect(typeof fs.mkdirSync).toBe('function');
            fs.mkdirSync(basedir + "/waffle-recipes", 0755);
            expect(newDirectory.exists()).toBe(true);
            newDirectory.delete();
            });
         
         it("should have a mkdir() function", function(done) {
            var newDirectory = new helper.Directory(basedir + "/waffle-recipes");
            newDirectory.delete();
            expect(typeof fs.mkdir).toBe('function');
            fs.mkdir(basedir + "/waffle-recipes", 0755, function() {
                     expect(newDirectory.exists()).toBe(true);
                     newDirectory.delete();
                     done();
                     });
            });
         
         it("should have an rmdir function", function(done) {
            var dirname = basedir + "/waffle-recipes";
            var newDirectory = new helper.Directory(dirname);
            fs.mkdir(dirname, 0755, function() {
                     expect(newDirectory.exists()).toBe(true);
                     fs.rmdir(basedir + "/waffle-recipes", function() {
                              expect(newDirectory.exists()).toBe(false);
                               done();
                              });
                     });
            });
         
         it("should have a rmdirSync function", function() {
            var dirname = basedir + "/waffle-recipes";
            var newDirectory = new helper.Directory(dirname);
            fs.mkdir(dirname, 0755);
                     expect(newDirectory.exists()).toBe(true);
                     fs.rmdirSync(dirname);
                     expect(newDirectory.exists()).toBe(false);
                     newDirectory.delete();
            });
         
         it("should have a rename function", function(done) {
            var tmpFile =  helper.createTempFile();
            expect(tmpFile.exists()).toBe(true);
            var newFile = new helper.File(basedir + "/granola.txt");
            newFile.delete();
            expect(newFile.exists()).toBe(false);
       
            fs.rename(tmpFile.getAbsolutePath(), basedir + "/granola.txt", function(e) {
                       expect(e).toBeFalsy();
                      expect(newFile.exists()).toBe(true);
                      newFile.delete();
                       done();
                      });
            });
         
         it("should have a renameSync function", function() {
            var tmpFile =  helper.createTempFile();
            expect(tmpFile.exists()).toBe(true);
            var newFile = new helper.File(basedir + "/granola.txt");
            newFile.delete();
            expect(newFile.exists()).toBe(false);
            fs.renameSync(tmpFile.getAbsolutePath(), basedir + "/granola.txt");
            expect(newFile.exists()).toBe(true);
            newFile.delete();
            });
         
         it("should fail with an error when renaming a non-existent file", function(done) {
            fs.rename("blarg", basedir + "/granola.txt", function(e) {
                      expect(new helper.File(basedir + "/granola.txt").exists()).toBe(false);
                      expect(e !== null).toBe(true);
                      done();
                
                      });
            });
         
         
         
        it("should be able to write to a file", function(done) {
            var tmpFile =  helper.createTempFile();
            
             fs.open(tmpFile.getAbsolutePath(), 'w', function(err, fd) {
                    var data = "My bologna has a first name";
                    expect(err).toBeFalsy();
                    expect(util.isNumber(fd)).toBe(true);
                    fs.write(fd, data, function(err, written, buffer) {
                             expect(err).toBeFalsy();
                             expect(written).toBe(data.length);
                             expect(buffer.toString()).toBe(data);
                             done();
                             });
                    });
            });
         
         
          it("should have a writeFile function", function(done) {
            console.log(tmpFile.getAbsolutePath());
            fs.writeFile(tmpFile.getAbsolutePath(),
                         'Now is the winter of our discontent made glorious summer by this son of York',
                         function (err) {
                         if (err) throw err;
                         fs.exists(tmpFile.getAbsolutePath(), function(exists) {
                                   expect(exists).toBe(true);
                                   done();
                                   });
                         });
            });
         
         it("should provide a read function", function(done) {
            var data = "One shouldn't let intellectuals play with matches";
            var tmpFile =  helper.createTempFile(data);
       
            fs.open(tmpFile.getAbsolutePath(), 'r', function(e,f) {
                    var b = new Buffer(data.length);
                    fs.read(f, b, 0, data.length, 0, function(er, bytesRead, buffer) {
                            expect(b.toString()).toBe(data);
                            tmpFile.delete();
                            done();
                            });
                    });
            });
         
         it("should provide a read sync function", function() {
            var data = "One shouldn't let intellectuals play with matches";
            var tmpFile =  helper.createTempFile(data);
            
           var f= fs.openSync(tmpFile.getAbsolutePath(), 'r');
                    var b = new Buffer(data.length);
           var bytesRead = fs.readSync(f, b, 0, data.length, 0);
            console.log(bytesRead);
                            expect(b.toString()).toBe(data);
                            tmpFile.delete();
            
            });
         
         it("should have an exists function", function(done) {
            var tmpFile =  helper.createTempFile();
            expect(fs.exists(tmpFile.getAbsolutePath(), function(exists) {
                             expect(exists).toBe(true);
                         //    done();
                             
                             expect(fs.exists('/some/invalid/path', function(exists) {
                                              expect(exists).toBe(false);
                                              tmpFile.delete();
                                              done();
                                              }));
                             }));
            });
         
         it("should have an existsSync function", function() {
            var tmpFile =  helper.createTempFile();
            expect(fs.existsSync(tmpFile.getAbsolutePath())).toBe(true);
            expect(fs.existsSync('/some/invalid/path')).toBe(false);
            tmpFile.delete();
            });
         
    /*     it("should have a truncate function", function(done) {
            helper.writeFixture(function(sut) {
                                fs.exists(sut.getAbsolutePath(), function(exists) {
                                          expect(exists).toBe(true);
                                          expect(sut.length()).toBe(data.length);
                                          fs.truncate(sut.getAbsolutePath(), 3, function(err, result) {
                                                      expect(sut.length()).toBe(3);
                                                      sut.delete();
                                                      done()
                                                      });
                                          });
                                }, data);
            });
         
         it("should extend files with trunctate() as well as shorten them", function(done) {
             helper.writeFixture(function(sut) {
                                fs.truncate(sut.getAbsolutePath(), 1024, function(err, result) {
                                            expect(sut.exists()).toBe(true);
                                            expect(sut.length()).toBe(1024);
                                            sut.delete();
                                            done()
                                            });
                                });
            });
         
         it("should provide synchronous truncate()", function(done) {
            fs.truncateSync(tmpFile.getAbsolutePath(), 6);
            expect(tmpFile.length()).toBe(6);
            });
         
         it("should provide ftruncate", function(done) {
            helper.writeFixture(function(sut) {
                                expect(sut.length()).toBe(data.length);
                                fs.open(sut.getAbsolutePath(), 'r+', function(err, fd) {
                                        fs.ftruncate(fd, 6, function(err) {
                                                     expect(err).toBeFalsy();
                                                     expect(sut.length()).toBe(6);
                                                     fs.close(fd, function() {
                                                              sut.delete();
                                                              done()
                                                              });
                                                     });
                                        });
                                }, data);
            });
         
         it("should extend files with ftrunctate() as well as shorten them", function(done) {
            helper.writeFixture(function(sut) {
                                fs.open(sut.getAbsolutePath(), 'r+', function(err, fd) {
                                        fs.ftruncate(fd, 1024, function(err, result) {
                                                     expect(err).toBeFalsy();
                                                     expect(sut.length()).toBe(1024);
                                                     fs.close(fd, function() {
                                                              sut.delete();
                                                              done()
                                                              });
                                                     });
                                        });
                                });
            });
         
         it("should provide synchronous ftruncate()", function(done) {
            helper.writeFixture(function(sut) {
                                fs.open(sut.getAbsolutePath(), 'r+', function(err, fd) {
                                        fs.ftruncateSync(fd, 6);
                                        expect(sut.length()).toBe(6);
                                        fs.close(fd, function() {
                                                 sut.delete();
                                                 done()
                                                 });
                                        });
                                }, data);
            });*/
         
      /*      it("should provide a readdir function", function(done) {
             fs.readdir(tempDir, function(e,r) {
                       expect(r.length).toBeGreaterThan(0);
                       // make sure this thing behaves like a JS array
                       expect((typeof r.forEach)).toBe('function');
                       for ( i = 0 ; i < r.length ; ++i ) {
                       expect( r[i].indexOf( "/" ) ).toBe(-1);
                       }
                       done()
                       });
            });
         
         it('should provide appropriate error for readdir if no-such-directoyr', function(done) {
            fs.readdir( '/i/do/not/exist/damnit', function(e,r) {
                       expect(e).not.toBe( undefined );
                       expect(r).toBe( undefined );
                       done()
                       });
            });
         
         
         
         it('should throw ENOENT for readdir if no-such-directory', function(done) {
            var caught;
            var entries;
            try {
            entries = fs.readdirSync( '/i/do/not/exist/damnit');
            } catch (e) {
            caught = e;
            }
            
            expect( entries ).toBe( undefined );
            expect( caught.code ).toBe( "ENOENT" );
            })
         
         it('should throw ENOTDIR for readdir on an existing non-dir file', function(done) {
            var caught;
            var entries;
            try {
            entries = fs.readdirSync( './pom.xml' );
            } catch (e) {
            console.log( e );
            caught = e;
            }
            expect( entries ).toBe( undefined );
            expect( caught.code ).toBe( "ENOTDIR" );
            })
         
         
         it("should provide a readdirSync function", function(done) {
            var r = fs.readdirSync(tempDir);
            expect(r.length).toBeGreaterThan(0);
            // make sure this thing behaves like a JS array
            expect((typeof r.forEach)).toBe('function');
            });
         
        
         it('should provide fs.fchmodSync', function(done) {
            helper.writeFixture(function(sut) {
                                var fd = fs.openSync(sut.getAbsolutePath(), 'r');
                                var err = fs.fchmodSync(fd, 0400);
                                expect(err).toBeFalsy();
                                var stat = fs.fstatSync(fd);
                                expect(stat.mode).toBe(33024);
                                sut.delete();
                                done()
                                });
            });
         
         it('should provide fs.fchmod', function(done) {
            helper.writeFixture(function(sut) {
                                var fd = fs.openSync(sut.getAbsolutePath(), 'r');
                                fs.fchmod(fd, 0400, function(e) {
                                          expect(e).toBeFalsy();
                                          var stat = fs.statSync(sut.getAbsolutePath());
                                          expect(stat.mode).toBe(33024);
                                          done()
                                          });
                                });
            });
         
         describe('realpath', function() {
                  it('should resolve existing files', function(done) {
                     var file = java.io.File.createTempFile("realpath-test", ".txt");
                     fs.writeFileSync(file.getAbsolutePath(), 'To be or not to be, that is the question');
                     fs.realpath(file.getAbsolutePath(), function(e, p) {
                                 expect(e).toBeFalsy();
                                 expect(p).toBeTruthy();
                                 expect(p).toBe(file.getCanonicalPath());
                                 fs.unlinkSync(file.getAbsolutePath());
                                 done()
                                 });
                     });
                  
                  it('should provide the callback function with an Error if path does not exist', function(done) {
                     var filename = 'some-file-that-does-not-exist.txt';
                      fs.realpath(filename, function(e, p) {
                                 expect(e).toBeTruthy();
                                 expect(e.syscall).toBe('stat');
                                 var util = require('util');
                                 expect(p).toBeFalsy();
                                 done()
                                 });
                     });
                  
                  it('should resolve cached paths when provided with a cache', function(done) {
                     var cache = {'/flavors/cherry-lime':'/beverages/soda/flavors/cherry-lime'};
                     fs.realpath('/flavors/cherry-lime', cache, function(e,p) {
                                 expect(e).toBeFalsy();
                                 expect(p).toBeTruthy();
                                 expect(p).toBe('/beverages/soda/flavors/cherry-lime');
                                 done()
                                 });
                     });
                  
                  it('should have an analogous sync function', function(done) {
                     var file = java.io.File.createTempFile("realpath-test", ".txt");
                     var filename = file.getAbsolutePath();
                     fs.writeFileSync(filename, 'To be or not to be, that is the question');
                     var p = fs.realpathSync(filename);
                     expect(p).toBeTruthy();
                     var f = new java.io.File(filename);
                     expect(p).toBe(f.getCanonicalPath());
                     fs.unlinkSync(filename);
                     });
                  
                  it('should throw when the path is not found synchronously', function(done) {
                     var filename = 'some-file-that-does-not-exist.txt';
                     try {
                     fs.realpathSync(filename);
                     this.fail('fs.realpathSync should have thrown');
                     } catch (e) {
                     expect(e).toBeTruthy();
                     expect(e.syscall).toBe('stat');
                     }
                     });
                  
                  it('should resolve cached paths synchronously, too', function(done) {
                     var cache = {'/flavors/cherry-lime':'/beverages/soda/flavors/cherry-lime'};
                     var p = fs.realpathSync('/flavors/cherry-lime', cache);
                     expect(p).toBeTruthy();
                     expect(p).toBe('/beverages/soda/flavors/cherry-lime');
                     });
                  
                  });
         
         describe("when opening files", function() {
                  
                  it("should error on open read if the file doesn't exist", function(done) {
                     fs.open('some-non-file.txt', 'r', function(e, f) {
                             expect(e instanceof Error).toBeTruthy();
                             done()
                             });
                     });
                  
                  it("should open files for reading", function(done) {
                     helper.writeFixture(function(sut) {
                                         fs.open(sut.getAbsolutePath(), 'r', function(e, f) {
                                                 expect(e).toBeFalsy();
                                                 sut.delete();
                                                 done()
                                                 });
                                         });
                     });
                  
                  it("should open files for writing", function(done) {
                      helper.writeFixture(function(sut) {
                                         fs.open(sut.getAbsolutePath(), 'r+', null, function(e, f) {
                                                 expect(e).toBeFalsy();
                                                 sut.delete();
                                                 done()
                                                 });
                                         });
                     });
                  
                  it("should provide an error if attempting to close null", function(done) {
                     fs.close(null, function(e) {
                              expect(e.message).toBe("Don't know how to close null");
                              done()
                              });
                     });
                  
                  it("should close", function(done) {
                      helper.writeFixture(function(sut) {
                                         fs.open(sut.getAbsolutePath(), 'r+', null, function(e, f) {
                                                 expect(!e).toBe(true);
                                                 fs.close(f, function(ex) {
                                                          expect(!ex).toBe(true);
                                                          sut.delete();
                                                          done()
                                                          });
                                                 });
                                         });
                     });
                  
                  it("should be able to read a file contents", function(done) {
                     var contents = "American Cheese";
                     helper.writeFixture(function(sut) {
                                         fs.readFile(sut.getAbsolutePath(), function(err, file) {
                                                     expect(err).toBeFalsy();
                                                     expect(typeof file).toBe('object');
                                                     expect(file instanceof Buffer).toBe(true);
                                                     expect(file.toString('ascii')).toBe(contents);
                                                     sut.delete();
                                                     done()
                                                     });
                                         }, contents);
                     });
                  
                  it("should be able to read a file using encoding", function(done) {
                      var contents = "American Cheese";
                     helper.writeFixture(function(sut) {
                                         fs.readFile(sut.getAbsolutePath(), {encoding:'ascii'}, function(err, str) {
                                                     expect(typeof str).toBe('string');
                                                     expect(str).toBe(contents);
                                                     sut.delete();
                                                     done()
                                                     });
                                         }, contents);
                     });
                  
                  describe("synchronously", function() {
                           
                           it("should error on openSync read if the file doesn't exist", function(done) {
                              try {
                              var f = fs.openSync('some-non-file.txt', 'r');
                              } catch(e) {
                              expect(e instanceof Error).toBeTruthy();
                              }
                              });
                           
                           it("should open files with openSync in write mode", function(done) {
                               helper.writeFixture(function(sut) {
                                                  var f = fs.openSync(sut.getAbsolutePath(), 'r+', null);
                                                  expect(f).toBeTruthy();
                                                  sut.delete();
                                                  done()
                                                  });
                              });
                           
                           it("should open files with openSync in read mode", function(done) {
                              helper.writeFixture(function(sut) {
                                                  var f = fs.openSync(sut.getAbsolutePath(), 'r', null);
                                                  expect(f).toBeTruthy();
                                                  sut.delete();
                                                  done()
                                                  });
                              });
                           
                           it("should close files synchronously", function(done) {
                              helper.writeFixture(function(sut) {
                                                  fs.open(sut.getAbsolutePath(), 'r+', null, function(e, f) {
                                                          expect(!e).toBe(true);
                                                          var ex = fs.closeSync(f);
                                                          expect(!ex).toBe(true);
                                                          sut.delete();
                                                          done()
                                                          });
                                                  });
                              });
                           
                           it("should close files synchronously, even non-filedescriptors", function(done) {
                              var e = fs.closeSync(null);
                              expect(e instanceof Error).toBeTruthy();
                              });
                           
                           it("should be able to read a file", function(done) {
                              var contents = "American Cheese";
                              helper.writeFixture(function(sut) {
                                                  var result = fs.readFileSync(sut.getAbsolutePath());
                                                  expect(typeof result).toBe('object');
                                                  expect(result.toString('ascii')).toBe(contents);
                                                  sut.delete();
                                                  done()
                                                  }, contents);
                              });
        
        
        it("should be able to symlink files", function(done) {
        helper.writeFixture(function(sut) {
        var srcPath = sut.getAbsolutePath();
        var dstPath = sut.getAbsolutePath() + '.link';
        fs.symlink(srcPath, dstPath, function(err) {
        expect(err === undefined).toBeTruthy();
        expect(fs.readlinkSync(dstPath)).toBe(srcPath);
        fs.unlink(srcPath);
        fs.unlink(dstPath);
        done()
        });
        });
        });
        
        it("should be able to link files", function(done) {
        helper.writeFixture(function(sut) {
        var srcPath = sut.getAbsolutePath();
        var dstPath = sut.getAbsolutePath() + '.link';
        fs.link(srcPath, dstPath, function(err) {
        expect(err === undefined).toBeTruthy();
        expect(fs.existsSync(dstPath)).toBeTruthy();
        fs.unlink(srcPath);
        fs.unlink(dstPath);
        done()
        });
        });
        });
         
         
         
                           it("should be able to read a file with encoding", function(done) {
                              var contents = "American Cheese";
                              helper.writeFixture(function(sut) {
                                                  var result = fs.readFileSync(sut.getAbsolutePath(), {encoding: 'ascii'});
                                                  expect(typeof result).toBe('string');
                                                  expect(result).toBe(contents);
                                                  sut.delete();
                                                  done()
                                                  }, contents);
                              });
                           
                           });
                  
                  });*/
         
         });
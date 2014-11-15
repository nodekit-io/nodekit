describe("#buildSpecRunner", function() {
  var util = module.exports;

  beforeEach(function() {
    this.compileResultSpy = jasmine.createSpy('compile result');
    handlebars.compile.and.returnValue(this.compileResultSpy);
    fs.readFileSync.and.returnValue('template data')
  });

  it("should read the correct template file as UTF-8", function() {
    util.buildSpecRunner({});
    expect(fs.readFileSync).toHaveBeenCalledWith('ROOT/runner/spec_runner.html.hbs', 'utf8');
  });

  it("should compile the template with the template data", function() {
    util.buildSpecRunner({});
    expect(handlebars.compile).toHaveBeenCalledWith('template data');
  });

  it("should pass a copy of the files object to the template", function() {
    var files = { test: 'test' };
    util.buildSpecRunner(files);
    var filesObjCopy = this.compileResultSpy.calls.argsFor(0)[0];
    expect(filesObjCopy).not.toBe(files);
    expect(filesObjCopy.test).toBe('test');
  });

  it("should pass the showColor option to the template via the files object", function() {
    util.buildSpecRunner({}, 'color boolean');
    var filesObjCopy = this.compileResultSpy.calls.argsFor(0)[0];
    expect(filesObjCopy.showColors).toBe('color boolean');
  });

  it("should pass a stringified stack shortener to the template via the files object ", function() {
    util.buildSpecRunner({});
    var filesObjCopy = this.compileResultSpy.calls.argsFor(0)[0];
    expect(filesObjCopy.phantomPrintFunction).toBe(alertWithShortStack.toString());
  });

  describe("#alertWithShortStack", function() {
    beforeEach(function() {
      this.alertSpy = spyOn(window, 'alert');
    });

    it("should alert with the provided message with extraneous messages after the final sync removed", function() {
      var traceWithSync = 'some\nstack trace\nlines\n      at attemptSync';
      alertWithShortStack(traceWithSync);
      expect(this.alertSpy).toHaveBeenCalledWith('some\nstack trace\nlines');
    });

    it("should alert with the provided message if no sync is present", function() {
      var traceWithSync = 'some\nstack trace\nlines\netc';
      alertWithShortStack(traceWithSync);
      expect(this.alertSpy).toHaveBeenCalledWith('some\nstack trace\nlines\netc');
    });
  });
});

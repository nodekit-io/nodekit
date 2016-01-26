![NK-Scripting](../images/NKScripting.png?v01)
> **{NK} Scripting** is an advanced JavaScript - Native (Swift, Objective-C, .NET C#) bridge for hybrid applications.   It builds upon the core platform bridges such as JavaScriptCore or ChakraCore, but abstracts the implementation details and standardizes across even multiple scripting engine families on the same platform (e.g., Nitro WKWebView and UIWebViews on iOS).
It is the foundation of {NK} NodeKit.
 
# {NK} Scripting

## Features

### Native operating system engines
Rather than embedding a full version of the V8 engine such as with Node, Electron or NW, or even alternative such as ChakraCore, the {NK} Scripting environment simply uses the latest ES5 engine that is provided with the operating system (all of iOS, OSX, and Windows provide very reliable versions;  on Android we default to the native engine but also allow an embedded version fo the CrossWalk WebKit engine to harmonize across older devices).

Using the built-in engine instead of bundling one avoids a 50Mb download for even a one-line application, enables near instantaneous application start times, and makes app store approval generally a non-issue.  {NK} NodeKit provides a number of polyfills to harmonize any differences across the engines to allow the same application run on desktop and mobile across device families and platforms without a single modification.  In fact, it allows most Node packages to execute (as long as they are written in JavaScript and dont have V8-specific native bindings)

### JavaScript <-> Native Bridging

A NKScriptContext is an environment for running JavaScript code. A NKScriptContext instance represents the global object in the environment—if you’ve written JavaScript that runs in a browser, NKScriptContext is analogous to window. After creating a NKScriptContext, it’s easy to run JavaScript code that creates variables, does calculations, or even defines functions.

In fact, whatever properties, instance methods, and class methods we declare in native code in a NKScriptExport-inherited protocol will automatically be available to any JavaScript code. 

### Full Cross-Referencing

Cross-references between objects are automatically maintained whether between pure Javascript parent-child objects, or between native objects that both implement the NKScriptExport protocol.

### Fast, Synchronous and Asynchronous Bridging

The bridge defaults to asynchronous calls, for maximum performance in a multi-threaded eventing architecture, but automatically uses synchronous calls for any method names that end with the phrase `Sync` (case-sensitive).  The synchronous call is done using the highly performant, non-CPU looping, textbox prompt calls (for naturally asynchronous engines such as the Nitro engine in WKWebView), and using standard thread-transfer of JavaScriptCore where available. The overhead of the call is typically well less than `30ms`, despite the thread synchronization that must occur, compared to about `11ms` for asynchronous calls (benchmarks subject to verification).

### Universal JavaScript Engine Compatibility

The bridge works seamlessly across different native engines, and so you can change whether to use the UIWebView or pure JavaScriptCore engine on iOS and OSX which has the most rapid intraprocess communication and no-thread switching, OR you can use the highly performant Nitro engine of WKWebView, with its Just-In-Time (JIT) compilation of JavaScript to machine code in a multi-process architecture.  Both have their advantages and disadvantages, but for the first time you can profile your application to use either without coding changes, and with full App Store compatability.  Yes, compiled code on demand is now possible using this bridge.

### Extensible, Plugin Architecutre

Native code is managed in a modularized plugin, but plugins are nothing more than Objective-C or Swift classes, with no modifications.  In fact you don't even need to inherit NKScriptExport or include any extra properties or methods if you dont need the extra customization.

You can develop using JavaScriptCore which has the easiest Safari debugging communication, then switch to WKWebView for production.  You can even mix and match the communication mechanism for different plugins.  For JavaScriptCore you can use the NKScripting bridge, or just use JSExport and still use the same plugin loader and harmonized script evaluation method names. 

In fact, `{NK} Electro` and `{NK} Core` are nothing more than `{NK} Scripting` plugins designed to provide industry standard front-end and back-end capabilities respectively.

### Legacy Plugin Re-use

One extra plugin `{NK} Cordo`is available for `{NK} Scripting` that allows most Apache Cordova and Apache Crosswalk for iOS plugins to work.  So if you already have Cordova plugins that provide JavaScript access to hardware features such as accelerometers, sensors, etc., they should work fine within {NK} Scripting applications.

### Legacy Application Porting

Applications written for JavaScriptCore should work with few modifications, as while definitely a subset, the most commonly used API features are written to be method compatible.

Similarly applications written for Atom Electron should work if they use the subset of the API provided in `{NK} Electro` (again the most commonly used functions that are envisaged as necessary across desktop and mobile applications).  Some work will be required in porting, but the majority of it should be byte for byte source code compatible.

## API

### Modules for creating and using the Scripting Engine:

* [NKScriptContext](script-context.md)
* [NKScriptContextFactory](script-context-factory.md)
* [NKScriptExport](script-export.md)
* [NKScriptSource](script-source.md)
* [NKScriptValue](script-value.md)

### Internal classes for reference:
* [NKScriptChannel](script-channel.md)
* [NKScriptInvocation](script-invocation.md)
* [NKScriptMessage](script-message.md)
* [NKScriptMetaObject](script-meta-object.md)
* [NKScriptValueNative](script-value-native.md)
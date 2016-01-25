![http://nodekit.io](https://raw.githubusercontent.com/nodekit-io/nodekit/master/doc/images/banner.png?v1)
{NK} NodeKit is the universal, open-source, cross-platform, embedded engine for Node.js that provides a full Node.js instance inside any OS X, iOS, Android, or Windows applications.

It enables applications developed for node.js to developed once and run without alteration for any of the above platforms as well as in the browser.

This is a refined preview of the technology and is not intended for production use, but is supporting some production app store applications.  Use at your own caution.  Contributions welcome (details to follow)

# {NK} NodeKit

[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)


## Sample Application

``` bash
git clone https://github.com/nodekit-io/nodekit-sample.git
cd nodekit-sample
carthage update
```

## Simple Configuration

Two lines in main.swift to launch an embedded WebKit view and start the NodeKit engine (already included for you in the sample).   

``` swift
import NodeKit
NKNodeKit.start();
```

Then just make sure any standard Node application is in the app/ directory.

Update the package file to set the initial browser location.  The example here uses an embedded http server (the vanilla Node.js version in fact), but if you're running on a desktop or are prepared to use the old slow UIWebView, you can use your own custom protocol node://localhost  which is also built into NodeKit

``` json
     "node-baseurl": "http://localhost:8000/test",
     "node-splashtime": 2000,
     "window": {
        "title": "Sample Application",
        "width": 1024,
        "height": 600
    }
```

Note: the window item only makes sense on a desktop but is included since its now so easy to write once, use anywhere!

Then just build in XCode for both iOS and Mac targets.
   

## Distribution

The NodeKit repository contains an XCode project that compiles to an iOS 8 + and OS X 10.9 + dynamic framework.  Versions for Windows 10 and Android are in development.

The single framework file (containing binary code and embedded resources like the core Node.js javascript code) can just be included in any iOS or OS X application.    See the sample app for an example.   You can thus compile and create your own projects;  no app store consumer really needs to know how you built it unless you want to tell them or modify the NodeKit source. 

## Is it really Node.js ?

Yes for all the javascript portions (most of Node.js is written in javascript, of course).  No for all the V8 bindings.  

We include the direct source files from Node.js source directly in NodeKit (you can find them in the framework package in a folder called lib).  Then we add our own bindings to replace the V8 native ones, writing them in javascript as much as possible, with a few native calls for the really platform specific stuff like sockets, timers, and the file system.

This means most Node packages will work without modification.  Those that require node-gyp would require an alternative. 

## How does it relate to Cordova, Electron, and Node-Webkit ? 

We've built upon the shoulders of the excellent Nodelike and Nodyn projects (both no longer maintained) and even Microsoft's Node fork  by taking the approach of re-writing the bindings to V8.  However, we've rewritten (or reused open source) versions in javascript as far as possible.  The whole theory of Node.js is that javascript is pretty fast, in fact if compiled its really really fast.  Bridging back and forth to native introduces latency which we like to avoid.

The real motivation however, wasn't just speed of execution -- as you'll see we favor JavaScriptCore instead of WKWebView for running the actual sandboxed Node application, which doesnt come with the JIT compilation benefits of WKWebView (which we use for the user interface on iOS and optionally on the desktop), but rather we didnt want to include a large 48Mb executable for WebKit or its javascript engines in every app download... when most modern operating systems already include it.

So on iOS and Macs we use JavaScriptCore... on Windows we use Chakra... and on Android and Linux we use V8.   Since its Node.js on each the only things we had to write (once) were the bindings and again really just the primary four (TCP sockets, UDP sockets, timers and the file system).  Others like buffers, cryptography etc., are replaced by javascript only versions.

## Supports

iOS 8+, 9+
OS X 10.9, 10.10, 10.11
Swift and Objective-C source (we wrote it nearly all in Swift 2.x)
Node.js ~0.12.x

## Still In Development

Android
Windows 10
Node.js 4.x/5.x updates (we run a very stable 0.12.x, and are testing the 4.x version in a development branch).

## License

Apache 2.0


## News

(December 2015) Updated for Swift 2.0 and refactored for iOS and OS X.
Master branch contains Node.js v0.12.x (working).   
Node.js V4.x branch available but not in accelerated development.



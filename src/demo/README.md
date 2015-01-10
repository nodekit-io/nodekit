![nodeAppKit](https://raw.github.com/OwinJS/owinjs-demo/master/owinjs-splash/images/logo.png)
# OWIN/JS Demonstratation App

[![NPM version](https://badge.fury.io/js/owinjs-demo.png)](http://badge.fury.io/js/owinjs-demo)

This is a demonstration app for OWIN/JS and the cross platform nodeAppKit native web framework. 

It runs under both node.js and as a native application on OS/X with no changes.

Open source under Mozilla Public License.

### About

nodeAppKit is currently in an incomplete state, but does compile and runs basic node, connect, express and OWIN/JS applications.

It is conceptually similar to node-webkit and GitHub atom, but runs on mobile platforms, within appstores and even on servers, and doesnt require changes to server side code when porting a web app (or vice versa). 

### Screenshot
[![image](https://raw.githubusercontent.com/OwinJS/owinjs-demo/master/owinjs-demo.png)](https://raw.githubusercontent.com/OwinJS/owinjs-demo/master/owinjs-demo.png)

### How to Use
#### Clone the project

```bash
$ git clone https://github.com/OwinJS/owinjs-demo.git`
```

#### Install the dependencies

```bash
$ npm install

$ bower install
```

#### OWIN/JS Host Option 1

Download the binary nodeAppKit application
```bash
$ curl -LOk https://github.com/OwinJS/nodeAppKit/releases/download/v0.1/nodeAppKit.app.zip

$ unzip nodeAppKit.app.zip

$ rm -rf nodeAppKit.app.zip
```

Run the nodeAppKit application
```
$ open nodeAppKit.app
```

#### OWIN/JS Host Option 2
Run using node (opens the default browser)
```bash
$ node index.js
```

### Pre-requisites

#### [node.js and npm](http://nodejs.org)

#### [Bower](http://bower.io)

#### [OwinJS/owinjs](https://github.com/OwinJS/owinjs)

#### [OwinJS/nodeAppKit](http://nodeappkit.owinjs.org/)


### Frameworks

#### [OWIN/JS](http://owinjs.org)

#### [javascriptcore](http://asciiwwdc.com/2013/sessions/615)

#### [webkit](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/DisplayWebContent/DisplayWebContent.html#//apple_ref/doc/uid/10000164i)

#### [node.js](http://nodejs.org)

#### [nodelike](https://github.com/node-app/Nodelike)

#### [OwinJS/owinjs-razor](https://github.com/OwinJS/owinjs-razor)

#### [OwinJS/owinjs-static](https://github.com/OwinJS/owinjs-static)

#### [OwinJS/owinjs-router](https://github.com/OwinJS/owinjs-router)


### License

Open source under Mozilla Public License 2.0.


### Author

nodeAppKit container framework hand-coded by OwinJS;  see frameworks above for respective authorship of the core components
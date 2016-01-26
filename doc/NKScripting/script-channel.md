![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptChannel

Internal mechanism used by `{NK} Scripting` to manage all of the communication between native code and Javascript for each plugin.  A channel is generally created for each plugin class and (if not a singleton) for each instance of a plugin object. 

Channels may communicate using intraprocess communication (e.g., JSExport for JavaScriptCore asynchronous and synchronous calls) or via platform-provided inter-process communication (e.g., webkit messagechannel for `WKWebView` Nitro engine for asynchronous communication, and via window.prompt channel for synchronous coordination).  NKEvaluateJavaScript is generally used everywhere internally for communication from native back to javascript.


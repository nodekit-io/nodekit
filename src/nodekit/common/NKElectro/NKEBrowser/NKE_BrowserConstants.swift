/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) 2013 GitHub, Inc. under MIT License
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

import Foundation

public enum NKEBrowserType: String {
    case WKWebView = "WKWebView"
    case UIWebView = "UIWebView"
}

struct NKEBrowserDefaults {
    static let nkBrowserType: String = "WKWebView"
    static let kTitle: String = "NodeKit App"
    static let kWidth: Int = 800
    static let kHeight: Int = 600
    static let kPreloadURL: String = "https://google.com"
}

struct NKEBrowserOptions {
    static let nkBrowserType: String = "nk.browserType"
    static let kTitle: String = "title"
    static let kIcon: String = "icon"
    static let kFrame: String = "frame"
    static let kShow: String = "show"
    static let kCenter: String = "center"
    static let kX: String = "x"
    static let kY: String = "y"
    static let kWidth: String = "width"
    static let kHeight: String = "height"
    static let kMinWidth: String = "minWidth"
    static let kMinHeight: String = "minHeight"
    static let kMaxWidth: String = "maxWidth"
    static let kMaxHeight: String = "maxHeight"
    static let kResizable: String = "resizable"
    static let kFullscreen: String = "fullscreen"
    // Whether the window should show in taskbar.
    static let kSkipTaskbar: String = "skipTaskbar"
    // Start with the kiosk mode, see Opera's page for description:
    // http://www.opera.com/support/mastering/kiosk/
    static let kKiosk: String = "kiosk"
    // Make windows stays on the top of all other windows.
    static let kAlwaysOnTop: String = "alwaysOnTop"
    // Enable the NSView to accept first mouse event.
    static let kAcceptFirstMouse: String = "acceptFirstMouse"
    // Whether window size should include window frame.
    static let kUseContentSize: String = "useContentSize"
    // The requested title bar style for the window
    static let kTitleBarStyle: String = "titleBarStyle"
    // The menu bar is hidden unless "Alt" is pressed.
    static let kAutoHideMenuBar: String = "autoHideMenuBar"
    // Enable window to be resized larger than screen.
    static let kEnableLargerThanScreen: String = "enableLargerThanScreen"
    // Forces to use dark theme on Linux.
    static let kDarkTheme: String = "darkTheme"
    // Whether the window should be transparent.
    static let kTransparent: String = "transparent"
    // Window type hint.
    static let kType: String = "type"
    // Disable auto-hiding cursor.
    static let kDisableAutoHideCursor: String = "disableAutoHideCursor"
    // Use the OS X's standard window instead of the textured window.
    static let kStandardWindow: String = "standardWindow"
    // Default browser window background color.
    static let kBackgroundColor: String = "backgroundColor"
    // The WebPreferences.
    static let kWebPreferences: String = "webPreferences"
    // The factor of which page should be zoomed.
    static let kZoomFactor: String = "zoomFactor"
    // Script that will be loaded by guest WebContents before other scripts.
    static let kPreloadScript: String = "preload"
    // Like --preload, but the passed argument is an URL.
    static let kPreloadURL: String = "preloadURL"
    // Enable the node integration.
    static let kNodeIntegration: String = "nodeIntegration"
    // Instancd ID of guest WebContents.
    static let kGuestInstanceID: String = "guestInstanceId"
    // Enable DirectWrite on Windows.
    static let kDirectWrite: String = "directWrite"
    // Web runtime features.
    static let kExperimentalFeatures: String = "experimentalFeatures"
    static let kExperimentalCanvasFeatures: String = "experimentalCanvasFeatures"
    // Opener window's ID.
    static let kOpenerID: String = "openerId"
    // Enable blink features.
    static let kBlinkFeatures: String = "blinkFeatures"
}


struct NKEBrowserSwitches {

   // Enable plugins.
    static let kEnablePlugins: String = "enable-plugins"
    // Ppapi Flash path.
    static let kPpapiFlashPath: String = "ppapi-flash-path"
    // Ppapi Flash version.
    static let kPpapiFlashVersion: String = "ppapi-flash-version"
    // Path to client certificate.
    static let kClientCertificate: String = "client-certificate"
    // Disable HTTP cache.
    static let kDisableHttpCache: String = "disable-http-cache"
    // Register schemes to standard.
    static let kRegisterStandardSchemes: String = "register-standard-schemes"
    // Register schemes to handle service worker.
    static let kRegisterServiceWorkerSchemes: String = "register-service-worker-schemes"
    // The minimum SSL/TLS version ("tls1", "tls1.1", or "tls1.2") that
    // TLS fallback will accept.
    static let kSSLVersionFallbackMin: String = "ssl-version-fallback-min"
    // Comma-separated list of SSL cipher suites to disable.
    static let kCipherSuiteBlacklist: String = "cipher-suite-blacklist"
    // The browser process app model ID
    static let kAppUserModelId: String = "app-user-model-id"
    // The command line switch versions of the options.
    static let kZoomFactor: String = "zoom-factor"
    static let kPreloadScript: String = "preload"
    static let kPreloadURL: String = "preload-url"
    static let kNodeIntegration: String = "node-integration"
    static let kGuestInstanceID: String = "guest-instance-id"
    static let kOpenerID: String = "opener-id"
    // Widevine options
    // Path to Widevine CDM binaries.
    static let kWidevineCdmPath: String = "widevine-cdm-path"
    // Widevine CDM version.
    static let kWidevineCdmVersion: String = "widevine-cdm-version"

}

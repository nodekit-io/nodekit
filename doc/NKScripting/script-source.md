![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptSource

Standard message format for communication from JavaScript to native plugins.

## Constructor

### `init(source: String, asFilename: String, namespace: String?, cleanup: String?)`

#### `source: String`
The actual JavaScript source code, in pure string format

#### `asFilename: String`
The full path and file name used in the sourceURL footer and shown in the Safari debugger

#### `namespace: String`
The namespace that represents the object of the sourcecode.  Optional but used for cleanup if 
the source code script object is garbage collected from memory
  
#### `cleanup: String`
The script that is executed upon cleanup (default is `"delete \(namespace)"`)

## Instance Properties


  public let source: String
    public let cleanup: String?
    public let filename: String
    public let namespace: String?
 
### `source: String`
The actual JavaScript source code, in pure string format

### `filename: String`
The full path and file name used in the sourceURL footer and shown in the Safari debugger

### `namespace: String`
The namespace that represents the object of the sourcecode.  Optional but used for cleanup if 
the source code script object is garbage collected from memory
  
### `cleanup: String`
The script that is executed upon cleanup (default is `"delete \(namespace)"`)
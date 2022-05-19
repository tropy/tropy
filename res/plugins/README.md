Tropy Plugins
=============
Tropy can be extended via plugins. A plugin is a [CommonJS JavaScript
module](https://nodejs.org/api/modules.html), which follows the conventions
outlined in this document to [hook](#hooks) into several aspects of Tropy and
provide extra functionality.

For a detailed guide on writing your own plugin, please refer to our [sample
plugin](https://github.com/tropy/tropy-plugin-example).

Installation
------------
When installed, Tropy plugins are placed in the plugins folder (alternatively,
plugins can be installed via `npm` into a `node_modules` sub-folder) accessible
from Tropy's help menu.

Specification
-------------
Like most CommonJS modules, a Tropy plugin consists of a folder with a
[package.json](https://docs.npmjs.com/files/package.json) file which defines
the plugin's metadata, configuration, and entry points. In addition to its
standard properties, this file must include a top-level field "hooks" that
specifies which Tropy functionality the plugin wants to extend.
```json
{
  "name": "my-plugin",
  "main": ".src/plugin.js",
  "icon": "./icon.svg",
  "hooks": {
    "export": true,
    "import": false
  },
  "options": [
  ]
}
```
The module's main entry point (`src/plugin.js` in the example above) must
export a class with the following constructor:
```js
class MyPlugin {
  constructor(options, context) {
  }
}

module.exports = MyPlugin
```
When installed into Tropy, the plugin will be initialized at start-up, with the
`options` parameter receiving the plugin's [configuration](#options), and
`context` an object providing access to a range of Tropy's built-in
functionality, notably the logger or the dialog sub-system.

In addition to this constructor, the class must define a method with the same
name as each hook it has registered in its `package.json`. The method's
signature is specific to the respective hook and can be invoked in different
ways via Tropy's user interface.

Options
-------
Your plugin is likely to need some user-defined configuration options. These
options can be specified in the `package.json` file using the top-level
"options" array and adjusted by users in the plugins section of Tropy's
preferences window. Here is an example of a plugin parameter in your
`package.json`:
```json
"options": [
  {
    "field": "fileName",
    "type": "save-file",
    "default": "output.csv",
    "hint": "Please specify the location of the output file",
    "label": "Output file"
  }
]
```
Each parameter can be described with the following properties:

* **field** defines the name you will use to access this option in your code.
  In the previous example, your plugin will receive an `options` parameter with
  `fileName` set to the value selected via the plugin preferences.

* **type** determines the type of input control Tropy will use for the
  parameter in the plugins preference pane. Its default value of 'string',
  if omitted, corresponds to a regular text box. Other possibilities are
  `boolean` for a checkbox, `number` for a number input, `template` for a
  dropdown menu of templates, `property` for a dropdown menu of linked data
  properties, or `save-file` for a dialog to choose a file location.

* **default** optionally sets the parameter's default value.

* **label** is a mandatory string which appears as the parameter's label in the
  plugin preferences.

* **hint** is an optional string that is displayed when the cursor hovers over
  the label.

You can also define other attributes here, such as **placeholder** and
**required**, if appropriate for the type of input you have selected, and these
are passed through to the corresponding form field.

Context
-------
The `context` object is supplied to each plugin instance and provides access to
various of Tropy's sub-systems available at runtime. These include the `logger`
and `dialog`, which can be used to write directly to Tropy's logger or to open
dialog windows (e.g., to select a local file). The context also exposes access
to [jsonld.js](https://github.com/digitalbazaar/jsonld.js) bundled with Tropy
via `json.expand()` and `json.compact()`.

For more advanced requirements, the context also exposes access to the project
`window` object, which include's the store for read-only access to the current
project and all installed templates and vocabularies.

Hooks
-----
Your plugin specifies which hooks it responds to in its `package.json` under
the "hooks" key, and must include an async method on the `Plugin` class with
the same name as the hook.

* The **export** hook is activated by users via the export sub-menu. When
  called, a plugin's `export()` method will receive the JSON-LD data of the
  currently selected item or items (or all items in the project, if none are
  selected). The method may process the data as appropriate (e.g., convert it
  to a different format and save it to a file, upload it to a web service,
  etc.); it is not expected to return anything back to Tropy.

* The **import** hook can be invoked via the import sub-menu. The corresponding
  hook method will be called with the `payload` object of Tropy's import
  command. The plugin is expected to add either a list of JSON-LD items to
  `payload.data` or a list of files to `payload.files` or `payload.urls` for
  Tropy to import.

Dependencies
------------
Like every CommonJS module, your plugin can use `require` to load additional
source files. When loaded by Tropy, your plugin can access Node.js and Electron
APIs as well as local resources using relative paths.  Although it is possible
to load additional modules via `npm`, our general advice is against that,
because Tropy does not ship with `npm`. If your plugin relies on third-party
modules, it is therefore good practice to bundle them with your plugin.

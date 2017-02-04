# hexMachina generator

Extension to generate common files for `hexMachina` MVC+S framework written in `haxe`

## Features

Current buckets can be generted:
 - Model (including regular and Read-only interfaces)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `hexMachinaGenerator.showFullPath`: Shows the full path as an initial value in the text box for the path.
* `hexMachinaGenerator.relativeTo`: Whether the entered path should be treated relative to the existing 'project', the currently selected 'file' or specified 'root'. If set to 'root' you need to set the 'rootDirectory' setting.
* `hexMachinaGenerator.rootDirectory`: Only used when 'relativeTo' is set to 'root'. Used as the root for creating new files.

## Release Notes

Just empty files creation added

### 0.0.3

Settings fixed

### 0.0.1

Initial release of hexMachina Generator

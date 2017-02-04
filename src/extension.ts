/// <reference path="../typings/tsd.d.ts" />
'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, commands, window, workspace, QuickPickItem, QuickPickOptions, TextEditor } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';
import * as mkdirp from 'mkdirp';

const DEFAULT_MODEL_NAME = "NewModel";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "hexmachina-generator" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.generateModel', () => {
        // The code you place here will be executed every time your command is executed

        const File = new FileController().readSettings();

        File.showFileNameDialog(DEFAULT_MODEL_NAME)
            .then(File.createFile)
            .then(File.createInterfaceFile)
            .then(File.createROInterfaceFile)
            .then(File.openFileInEditor)
            .catch((err) => {
                if (err.message) {
                    window.showErrorMessage(err.message);
                }
            });
    });

    context.subscriptions.push(disposable);
}

export interface NewFileSettings {
    showFullPath: boolean;
    relativeTo: string;
    rootDirectory: string;
}

export class TemplatesController {
    public createModelFiles() {

    }
}

export class FileController {
    private settings: NewFileSettings;

    public readSettings(): FileController {
        let config = workspace.getConfiguration('hexMachinaGenerator');

        this.settings = {
            showFullPath: config.get('showFullPath', true),
            relativeTo: config.get('relativeTo', 'file'),
            rootDirectory: config.get('rootDirectory', this.homedir())
        };

        return this;
    }

    public determineRoot(): string {
        let root: string;

        if (this.settings.relativeTo === 'project') {
            root = workspace.rootPath;
        } else if (this.settings.relativeTo === 'file') {
            if (window.activeTextEditor) {
                root = path.dirname(window.activeTextEditor.document.fileName);
            } else if (workspace.rootPath) {
                root = workspace.rootPath;
            }
        }

        if (!root) {
            this.settings.relativeTo === 'root';
            root = this.settings.rootDirectory;

            if (root.indexOf('~') === 0) {
                root = path.join(this.homedir(), root.substr(1));
            }
        }

        return root;
    }

    public getDefaultFileValue(root, fileName): string {

        if (this.settings.showFullPath) {
            return path.join(root, `${fileName}`);
        } else {
            return `${fileName}`;
        }
    }

    public showFileNameDialog(fileName): Q.Promise<string> {
        const deferred: Q.Deferred<string> = Q.defer<string>();
        let question = `What's the path and name of the new file?`;

        if (!this.settings.showFullPath) {
            if (this.settings.relativeTo === 'project') {
                question += ' (Relative to project root)';
            } else if (this.settings.relativeTo === 'file') {
                question += ' (Relative to current file)';
            }
        }

        let rootPath = this.determineRoot();
        let defaultFileValue = this.getDefaultFileValue(rootPath, fileName);

        window.showInputBox({
            prompt: question,
            value: defaultFileValue
        }).then(selectedFilePath => {
            if (selectedFilePath === null || typeof selectedFilePath === 'undefined') {
                deferred.reject(undefined);
                return;
            }
            selectedFilePath = selectedFilePath || defaultFileValue;
            if (selectedFilePath) {
                if (this.settings.showFullPath) {
                    deferred.resolve(selectedFilePath);
                } else {
                    deferred.resolve(this.getFullPath(rootPath, selectedFilePath));
                }
            }
        });

        return deferred.promise;
    }

    public createInterfaceFile(newFileName): Q.Promise<string> {
        const deferred: Q.Deferred<string> = Q.defer<string>();
        const fileName = path.basename(newFileName, '.hx');
        const filePath = path.dirname(newFileName);
        return FileController.creatFileObject(deferred, `${filePath}/I${fileName}.hx`, newFileName).promise;
    }

    public createROInterfaceFile(newFileName): Q.Promise<string> {
        const deferred: Q.Deferred<string> = Q.defer<string>();
        const fileName = path.basename(newFileName, '.hx');
        const filePath = path.dirname(newFileName);
        return FileController.creatFileObject(deferred, `${filePath}/I${fileName}RO.hx`, newFileName).promise;
    }

    public createFile(newFileName): Q.Promise<string> {
        const deferred: Q.Deferred<string> = Q.defer<string>();
        return FileController.creatFileObject(deferred, `${newFileName}.hx`, newFileName).promise;
    }

    private static creatFileObject(deferred, realFileName, baseFileName): Q.Deferred<string> {
        let dirname: string = path.dirname(realFileName);
        let fileExists: boolean = fs.existsSync(realFileName);

        if (!fileExists) {
            mkdirp.sync(dirname);

            fs.appendFile(realFileName, '', (err) => {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                deferred.resolve(baseFileName);
            });
        } else {
            deferred.resolve(baseFileName);
        }

        return deferred;
    }

    public openFileInEditor(fileName): Q.Promise<TextEditor> {
        const deferred: Q.Deferred<TextEditor> = Q.defer<TextEditor>();
        const realFileName = `${fileName}.hx`;

        workspace.openTextDocument(realFileName).then((textDocument) => {
            if (!textDocument) {
                deferred.reject(new Error('Could not open file!'));
                return;
            }

            window.showTextDocument(textDocument).then((editor) => {
                if (!editor) {
                    deferred.reject(new Error('Could not show document!'));
                    return;
                }

                deferred.resolve(editor);
            });
        });

        return deferred.promise;
    }

    private getFullPath(root: string, filePath: string): string {
        if (filePath.indexOf('/') === 0) {
            return filePath;
        }

        if (filePath.indexOf('~') === 0) {
            return path.join(this.homedir(), filePath.substr(1));
        }

        return path.resolve(root, filePath);
    }

    private homedir(): string {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
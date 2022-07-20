'use strict';
import { commands, ExtensionContext, workspace, languages, CodeActionProvider, TextDocument, CodeAction,
WorkspaceEdit} from 'vscode';
import { groupImports, updateSaveListener } from './group';

export function activate(context: ExtensionContext) {
  // register command
  context.subscriptions.push(commands.registerCommand(
    'extension.GroupImportsForGo',
    groupImports
  ));
  
  workspace.onDidChangeConfiguration(updateSaveListener);
}

export function deactivate() {}

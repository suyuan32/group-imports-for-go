'use strict';
import { commands, ExtensionContext, workspace } from 'vscode';
import { groupImports } from './group';

export function activate(context: ExtensionContext) {
  // register command
  context.subscriptions.push(commands.registerCommand(
    'extension.GroupImportsForGo',
    groupImports
  ));

  context.subscriptions.push(workspace.onWillSaveTextDocument(groupImports));
}

export function deactivate() {}

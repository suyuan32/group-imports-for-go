import { Range, window, workspace, WorkspaceEdit, TextDocument, Disposable, ExtensionContext } from 'vscode';
import { resolveRootPackage, getImportsRange, getImports } from './utils';

export const groupImports = async () => {
  const editor = window.activeTextEditor;
  let document: TextDocument;
  if (editor === undefined) {
    window.showErrorMessage(
      'Failed to find active window.'
    );
    return ;
  } else {
    document = editor.document;
  }
  const documentText = document.getText();
  if (documentText === undefined) {
    return ;
  }

  if (document.languageId !== 'go'){
    return ;
  }

  const rootPkg = await resolveRootPackage();
  if (rootPkg === undefined) {
    window.showErrorMessage(
      'Failed to resolve root project directory. No GOPATH variable or go.mod file found.'
    );
    return;
  }

  const imports = getImports(documentText);

  if (!imports.length) {
    return ;
  }

  const groupedList = group(imports, rootPkg);

  const importsRange = getImportsRange(documentText);

  const edit = new WorkspaceEdit();
  const range = new Range(
    importsRange.start,
    0,
    importsRange.end - 1,
    Number.MAX_VALUE
  );

  edit.replace(document.uri, range, importGroupsToString(groupedList, <number>getModeSetting()));
  workspace.applyEdit(edit).then();
};

type ImportGroups = {
  stdlib: string[];
  thirdParty: string[];
  own: string[];
};

const isStdlibImport = (imp: string): boolean => {
  return !imp.includes('.');
};

const isOwnImport = (imp: string, root: string): boolean => {
  return imp.includes(root);
};

export const group = (imports: string[], rootPkg: string): ImportGroups => {
  const importGroups = <ImportGroups>{
    stdlib: [],
    thirdParty: [],
    own: [],
  };

  imports.forEach((imp) => {
    if (isOwnImport(imp, rootPkg)) {
      if (!checkDuplicate(importGroups.own, imp)){
        importGroups.own.push(imp);
      }
    } else if (isStdlibImport(imp)) {
      if (!checkDuplicate(importGroups.stdlib, imp)){
        importGroups.stdlib.push(imp);
      }
    } else {
      if (!checkDuplicate(importGroups.thirdParty, imp)){
        importGroups.thirdParty.push(imp);
      }
    }
  });

  return importGroups;
};

// delete duplicate imports
export function checkDuplicate(data: string[], target: string): boolean {
  data.forEach(element => {
    if (element === target) {
      return true;
    }
  });
  return false;
}


// generate import string
const importGroupsToString = (importGroups: ImportGroups, mode: number): string => {
  console.log(mode);
  switch (mode) {
    case 1: {
      const importString: string[] = new Array();
      importString.push(importGroups.stdlib.join('\n'));
      importString.push(importGroups.thirdParty.join('\n'));
      importString.push(importGroups.own.join('\n'));
      return importString.join('\n\n');
    }
    case 2: {
      const importString: string[] = new Array();
      importString.push(importGroups.stdlib.join('\n'));
      importString.push(importGroups.own.join('\n'));
      importString.push(importGroups.thirdParty.join('\n'));
      return importString.join('\n\n');
    
    }
    default: {
      const importString: string[] = new Array();
      importString.push(importGroups.stdlib.join('\n'));
      importString.push(importGroups.thirdParty.join('\n'));
      importString.push(importGroups.own.join('\n'));
      return importString.join('\n\n');
    }
  }

};

// get Mode configuration
export const getModeSetting = () => {
  return workspace.getConfiguration('groupImportsForGo').get('Mode');
};



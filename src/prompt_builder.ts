import * as vscode from 'vscode';

export interface PromptParts {
  prefix: string;
  suffix: string;
}

export function buildPrompt(document: vscode.TextDocument, position: vscode.Position): PromptParts {
  const filePath = vscode.workspace.asRelativePath(document.uri);

  const prefixLines: string[] = [];
  prefixLines.push(`// ${filePath}`);
  for (let i = 0; i < position.line; i++) {
    prefixLines.push(document.lineAt(i).text);
  }
  prefixLines.push(document.lineAt(position.line).text.slice(0, position.character));

  const suffixLines: string[] = [];
  const curLineAfter = document.lineAt(position.line).text.slice(position.character);
  if (curLineAfter) {
    suffixLines.push(curLineAfter);
  }
  for (let i = position.line + 1; i < document.lineCount; i++) {
    suffixLines.push(document.lineAt(i).text);
  }

  return {
    prefix: prefixLines.join('\n'),
    suffix: suffixLines.slice(0, 50).join('\n'),
  };
}

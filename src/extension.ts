import * as vscode from 'vscode';
import { Range } from 'vscode';
import { getCompletion } from './llm_client';
import { buildPrompt } from './prompt_builder';

let isPending = false;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let idleTriggerRequested = false;

const waitingDecoration = vscode.window.createTextEditorDecorationType({
	after: {
		contentText: ' Generating...',
		color: new vscode.ThemeColor('editorGhostText.foreground'),
	},
});

export function activate(_context: vscode.ExtensionContext) {
	console.log('nano_inline_completion started');
	_context.subscriptions.push(waitingDecoration);

	const provider: vscode.InlineCompletionItemProvider = {
		async provideInlineCompletionItems(document, position, _context, _token) {
			if (!idleTriggerRequested) {
				return;
			}
			idleTriggerRequested = false;

			if (isPending) {
				return;
			}
			isPending = true;

			try {
				const config = vscode.workspace.getConfiguration('nanoInlineCompletion');
				const ignored = config.get<string[]>('ignoreFileExtensions', []);
				if (ignored.length > 0) {
					const fileName = document.fileName;
					if (ignored.some(ext => fileName.endsWith(ext.startsWith('.') ? ext : '.' + ext))) {
						return;
					}
				}

				const parts = buildPrompt(document, position);
				console.log('nano: request sent', JSON.stringify(parts));

				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {
					const cursorLine = activeEditor.document.lineAt(position.line);
					activeEditor.setDecorations(waitingDecoration, [cursorLine.range]);
				}

				const completion = await getCompletion(parts);
				if (!completion || _token.isCancellationRequested) {
					return;
				}

				let text = completion;
				if (config.get<boolean>('stripCodeFences', true)) {
					const idx = text.indexOf('```');
					if (idx !== -1) {
						text = text.slice(0, idx);
					}
				}
				if (config.get<boolean>('trimTrailingBrace', true)) {
					text = text.replace(/\s*\}\s*$/, '');
				}

				return {
					items: [{
						insertText: text,
						range: new Range(position, position),
						// completeBracketPairs: true,
					}],
					commands: [],
				};
			} finally {
				isPending = false;
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					editor.setDecorations(waitingDecoration, []);
				}
			}
		},

		// handleDidShowCompletionItem(_completionItem: vscode.InlineCompletionItem): void {
		// 	console.log('inline completion item shown');
		// },
	};

	_context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider)
	);

	_context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document !== event.document) return;

			const config = vscode.workspace.getConfiguration('nanoInlineCompletion');
			const delay = config.get<number>('idleDelay', 2000);

			if (idleTimer) clearTimeout(idleTimer);
			idleTimer = setTimeout(() => {
				idleTriggerRequested = true;
				vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
			}, delay);
		})
	);
}

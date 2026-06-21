import * as vscode from 'vscode';
import { Range } from 'vscode';
import { getCompletion } from './llm_client';
import { buildPrompt } from './prompt_builder';

let isPending = false;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let idleTriggerRequested = false;

export function activate(_context: vscode.ExtensionContext) {
	console.log('nano_inline_completion started');

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
				const parts = buildPrompt(document, position);
				console.log('nano: request sent', JSON.stringify(parts));

				const completion = await getCompletion(parts);
				if (!completion || _token.isCancellationRequested) {
					return;
				}

				return {
					items: [{
						insertText: completion,
						range: new Range(position, position),
						completeBracketPairs: true,
					}],
					commands: [],
				};
			} finally {
				isPending = false;
			}
		},

		handleDidShowCompletionItem(_completionItem: vscode.InlineCompletionItem): void {
			console.log('inline completion item shown');
		},
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

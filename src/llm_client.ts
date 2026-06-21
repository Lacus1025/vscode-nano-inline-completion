import * as vscode from 'vscode';
import OpenAI from "openai";
import { PromptParts } from './prompt_builder';

async function getOpenAIChatCompletion(prompt: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('nanoInlineCompletion');
  const apiKey = config.get<string>('apiKey') || '';
  const baseURL = config.get<string>('baseURL') || 'http://localhost:11434/v1';
  const model = config.get<string>('model') || 'qwen2.5-code:0.5b';
  const maxTokens = config.get<number>('maxTokens', 32);

  const client = new OpenAI({ baseURL, apiKey: apiKey || 'ollama' });

  const completion = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a code completion engine. Output raw code only. No markdown, no backticks, no explanations." },
      { role: "user", content: prompt },
    ],
    model,
    max_tokens: maxTokens,
    stream: false,
  });

  return completion.choices[0].message.content || '';
}

async function getOllamaNativeCompletion(prefix: string, suffix: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('nanoInlineCompletion');
  const baseURL = config.get<string>('baseURL') || 'http://localhost:11434/v1';
  const model = config.get<string>('model') || 'qwen2.5-code:0.5b';
  const maxTokens = config.get<number>('maxTokens', 64);

  const ollamaBase = baseURL.replace(/\/v1\/?$/, '');
  const url = `${ollamaBase}/api/generate`;

  let body: any;
  if (suffix) {
    body = {
      model,
      prompt: `<fim_prefix>${prefix}<fim_suffix>${suffix}<fim_middle>`,
      raw: true,
      options: { temperature: 0, num_predict: maxTokens, stop: ['<|im_end|>', '<|endoftext|>'] },
      stream: false,
    };
  } else {
    body = {
      model,
      prompt: prefix,
      raw: true,
      options: { temperature: 0, num_predict: maxTokens, stop: ['<|im_end|>', '<|endoftext|>'] },
      stream: false,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json() as { response?: string };
  return data.response || '';
}

export async function getCompletion(parts: PromptParts): Promise<string> {
  const config = vscode.workspace.getConfiguration('nanoInlineCompletion');
  const backend = config.get<string>('apiBackend', 'openai');

  try {
    if (backend === 'ollama-native') {
      return await getOllamaNativeCompletion(parts.prefix, parts.suffix);
    }

    const promptParts: string[] = [];
    promptParts.push('--- BEFORE CURSOR ---');
    promptParts.push(parts.prefix);
    if (parts.suffix) {
      promptParts.push('--- AFTER CURSOR ---');
      promptParts.push(parts.suffix);
    }
    promptParts.push('--- COMPLETE AT CURSOR ---');

    return await getOpenAIChatCompletion(promptParts.join('\n'));
  } catch (err) {
    vscode.window.showErrorMessage('LLM 请求失败: ' + (err instanceof Error ? err.message : String(err)));
    console.error('LLM 请求失败:', err);
    return '';
  }
}

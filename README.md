# nano-inline-completion

Minimal VS Code inline completion extension powered by local LLMs via [Ollama](https://ollama.com). Automatically suggests code completions after you stop typing.

Designed for small, fast models like **Qwen2.5-Coder:0.5B** — runs entirely offline on consumer hardware with no GPU required.

<div style="text-align: center;">
<img src="https://count.getloli.com/@:nano_inline_completion?name=%3Anano_inline_completion&theme=asoul&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto" alt="count" width="40%"/>
</div>

## Demo

<div style="text-align: center;">
  <img src="demo.gif" alt="Demo" width="80%"/>
</div>

## Features

- **Idle-triggered inline completions** — suggests code after you stop typing (default 2s delay)
- **Fill-in-the-Middle (FIM)** support via Ollama native API for prefix-suffix-aware completions
- **Two backends**: Ollama native FIM or OpenAI-compatible chat API
- **Lightweight** — only ~70 lines of TypeScript, minimal dependencies
- **Bracket pair completion** — VS Code's native bracket matching works on top of suggested code
- **Auto-trim trailing brace** — optionally removes trailing `}` from model output (enabled by default), preventing the model from prematurely closing a code block when the completion is incomplete

## Prerequisites

- [Ollama](https://ollama.com) installed and running
- A code completion model pulled via Ollama

## Quick Start

```bash
# 1. Pull a small, fast model (runs on CPU)
ollama pull qwen2.5-coder:0.5b

# 2. Install the extension in VS Code
# 3. Start typing — completions appear after 2 seconds of inactivity
```

The default configuration works out of the box with `qwen2.5-coder:0.5b` on `ollama-native` backend.

## Configuration

Open VS Code settings (`Ctrl+,`) and search for `nanoInlineCompletion`.

| Setting                                    | Default                       | Description                                                                    |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------ |
| `nanoInlineCompletion.model`             | `qwen2.5-coder:0.5b`        | Ollama model name                                                              |
| `nanoInlineCompletion.baseURL`           | `http://localhost:11434/v1` | Ollama API base URL                                                            |
| `nanoInlineCompletion.apiBackend`        | `ollama-native`             | Backend:`ollama-native` (FIM) or `openai` (chat)                           |
| `nanoInlineCompletion.maxTokens`         | `64`                        | Max output tokens per completion                                               |
| `nanoInlineCompletion.idleDelay`         | `2000`                      | Idle time (ms) before triggering completion                                    |
| `nanoInlineCompletion.trimTrailingBrace` | `true`                      | Remove trailing `}` from model output to avoid closing the block prematurely |
| `nanoInlineCompletion.apiKey`            | `""`                        | API key (only needed for remote OpenAI-compatible endpoints)                   |
| `nanoInlineCompletion.ignoreFileExtensions` | `[]`                   | File extensions to ignore (e.g. `[".md", ".txt"]`). Completions won't trigger in these files. |

### trimTrailingBrace

When enabled (default: `true`), the extension strips the last `}` character from the model's output, along with any trailing whitespace. This prevents the model from closing a code block when its output is only a partial completion — allowing you to continue typing inside the braces.

Example — without trimming, the model might suggest:

```c
void foo() {
    // do something
}
```

Then you'd have to backspace the `}` to add more code. With `trimTrailingBrace` enabled, the trailing `}` is removed automatically, leaving:

```c
void foo() {
    // do something
```

So you can keep typing inside the function body.

### ignoreFileExtensions

An array of file extensions for which completions should be suppressed. Useful for skipping non-code files like documentation, config, or data files.

```json
// Example: disable completions in markdown and text files
"nanoInlineCompletion.ignoreFileExtensions": [".md", ".txt"]
```

Both `".md"` and `"md"` are accepted — the extension normalizes the dot automatically.

## Backends

### `ollama-native` (recommended)

Calls Ollama's `/api/generate` endpoint directly with FIM (Fill-in-the-Middle) tokens:

- `<fim_prefix>` — code before cursor
- `<fim_suffix>` — code after cursor
- `<fim_middle>` — the model fills in the middle

This is the recommended backend for code completion models like `qwen2.5-coder`, `codellama`, `deepseek-coder`, etc.

### `openai`

Uses the OpenAI-compatible chat completions API (`/v1/chat/completions`). Works with any OpenAI-like endpoint, including:

- Ollama's OpenAI-compatible endpoint (same `baseURL`)
- Remote APIs (OpenAI, Together AI, etc.) — requires `apiKey`
- Local proxies

## Recommended Models

| Model                   | Size | Notes                                  |
| ----------------------- | ---- | -------------------------------------- |
| `qwen2.5-coder:0.5b`  | 0.5B | Fast, runs on CPU. Default.            |
| `qwen2.5-coder:1.5b`  | 1.5B | Better quality, still CPU-friendly     |
| `qwen2.5-coder:7b`    | 7B   | Best quality, needs GPU or lots of RAM |
| `deepseek-coder:1.3b` | 1.3B | Good for FIM completions               |
| `codellama:7b-code`   | 7B   | Good FIM support, larger               |

## How It Works

1. **Typing detection** — `onDidChangeTextDocument` resets an idle timer on every keystroke
2. **Idle trigger** — after `idleDelay` ms of no typing, fires `editor.action.inlineSuggest.trigger`
3. **Prompt construction** — builds a prefix (file comment + text before cursor) and suffix (text after cursor + next 50 lines)
4. **LLM request** — sends the prompt to Ollama via the selected backend
5. **Post-processing** — applies `trimTrailingBrace` if enabled
6. **Display** — returns the completion as a VS Code inline suggestion with bracket pair completion enabled

## Development

```bash
git clone https://github.com/Lacus1025/vscode_nano_inline_completion
cd vscode_nano_inline_completion
npm install
npm run compile
```

Press `F5` in VS Code to launch a new extension development host window.

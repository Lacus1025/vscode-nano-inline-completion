# nano_inline_completion

Minimal VS Code inline completion extension with local LLM support (Ollama).

<div style="text-align: center;">
<img src="https://count.getloli.com/@:nano_inline_completion?name=%3Anano_inline_completion&theme=asoul&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto" alt="count" width="40%"/>
</div>

## Demo

<div style="text-align: center;">
  <img src="demo.gif" alt="Demo" width="80%"/>
</div>

## Features

- Inline code completion triggered after **stopping typing for 2 seconds** (idle trigger)
- Supports Fill-in-the-Middle (FIM) via Ollama native API
- Customizable idle delay, model, and max tokens

## Setup

1. Install [Ollama](https://ollama.com) and pull a model:
   ```
   ollama pull qwen2.5-coder
   ```
2. Install the extension in VS Code
3. Configure in VS Code settings (`Ctrl+,`):

| Setting                             | Default                       | Description                      |
| ----------------------------------- | ----------------------------- | -------------------------------- |
| `nanoInlineCompletion.baseURL`    | `http://localhost:11434/v1` | Ollama API base URL              |
| `nanoInlineCompletion.model`      | `qwen2.5-coder:0.5b`             | Model name                       |
| `nanoInlineCompletion.apiBackend` | `ollama-native`             | `ollama-native` or `openai`  |
| `nanoInlineCompletion.idleDelay`  | `2000`                      | Idle time (ms) before triggering |
| `nanoInlineCompletion.maxTokens`  | `64`                        | Max output tokens                |

## Backends

- **`ollama-native`** — calls Ollama `/api/generate` directly with FIM tokens (`<fim_prefix>`, `<fim_suffix>`, `<fim_middle>`). Recommended for code completion models.
- **`openai`** — uses OpenAI-compatible chat API with structured prompt sections. Compatible with any OpenAI-like endpoint.

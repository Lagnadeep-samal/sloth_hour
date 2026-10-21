# Sloth Hour

A bedtime story and soft background sound, generated on your own machine.
No build step, no accounts, no API keys. After the model is downloaded, it works offline.

- **Stories:** a local open-weight model served by [Ollama](https://ollama.com)
- **Sound:** rain, ocean, wind and a deep hum, synthesized live with the Web Audio API (no audio files)
- **Voice:** your browser's built-in speech synthesis, read slowly
- **Sleep timer:** fades everything out and stops
- **Demo mode:** if Ollama isn't found, the page plays a built-in sample story so it still works
- **Installable:** works as an offline app (PWA)

## Run locally

```bash
ollama pull llama3.2
python -m http.server 8000     # use python3 on Mac/Linux
# open http://localhost:8000
```
If Ollama says the port is in use, it is already running. Skip `ollama serve`.

## Deploy (GitHub Pages)

1. Create a repo and push this folder to the `main` branch.
2. In the repo, go to Settings > Pages and set Source to **GitHub Actions**.
3. The included workflow publishes the site at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

The site is only static files. The model still runs on the visitor's own computer.

## Use the hosted page with your own Ollama

Browsers only let a website talk to your local Ollama if Ollama allows that website.

**Windows (PowerShell):**
```
setx OLLAMA_ORIGINS "https://YOUR-USERNAME.github.io"
```
Then quit Ollama from the tray icon and start it again.

**Mac/Linux:** `OLLAMA_ORIGINS="https://YOUR-USERNAME.github.io" ollama serve`

Reload the hosted page. The dot turns blue when it finds your model. Chrome may ask permission to access local devices; allow it.

## Why open models

- Works with the Wi-Fi off.
- Nothing you type or hear leaves your machine.
- Free to run every night, and you can swap models from the dropdown.

MIT licensed.

# Scribe

Open any GitHub repo, click the Scribe icon, get a README written for it.

No server, no localhost, nothing to start — the extension reads the repo through the GitHub
API and summarizes it with Groq directly from its background worker.

## Setup

```bash
npm install
npm run build
```

Load it into Chrome:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked** → select the `dist` folder
4. Click the Scribe icon → **Settings** → paste a Groq API key
   (free at [console.groq.com/keys](https://console.groq.com/keys)) → **Save**

Then open any `github.com` repo and hit **Generate README**.

The result panel has **Copy** and a **download icon** beside it — the download saves the
markdown straight to your downloads folder as `README.md`.

## Development

```bash
npm run dev     # Vite + HMR for the popup
```

`npm run build` produces the loadable `dist/`. After rebuilding, hit the reload arrow on the
Scribe card in `chrome://extensions`.

## How it works

```
popup (App.jsx)                  background worker
  detects owner/repo    ──────►    1. GET /repos/{owner}/{repo}          metadata
  from the active tab              2. GET .../git/trees/...?recursive=1  file tree
                                   3. GET .../contents/{path}            manifests,
                                                                         entry points,
                                                                         existing README
                                   4. POST api.groq.com/chat/completions
  renders markdown      ◄──────    result cached in chrome.storage
```

Generation runs in the **background worker**, not the popup. Chrome tears the popup down
whenever it loses focus, so the run is written to `chrome.storage` and the popup reattaches
to it when reopened — close the popup mid-run and the result is still waiting for you.

### What gets sent to the model

Only what's needed to describe the repo, kept small on purpose:

| Piece            | Limit                                                          |
| ---------------- | -------------------------------------------------------------- |
| File tree        | 400 paths, minus `node_modules/`, build output, binaries, locks |
| Dependency files | up to 3 (`package.json`, `requirements.txt`, `go.mod`, …)       |
| Entry points     | up to 3 source files, 3,500 chars each                          |
| Existing README  | 2,500 chars, as context for writing a better one                |

A typical repo lands around 2,000 tokens. If no conventionally-named entry point exists, the
shallowest source files are used instead, so the model always sees real code rather than a
bare file list.

## Settings

| Setting          | Notes                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| **Groq API key** | Required. Stored in `chrome.storage.local` — never bundled into the build         |
| **Model**        | Loaded live from your key via `GET /openai/v1/models`, so the list only shows models you can actually use. Hit *refresh* next to the dropdown after changing keys |
| **GitHub token** | Optional. Needed for private repos; lifts the 60 requests/hour anonymous limit to 5,000 |

## Layout

```
Scribe/
├── manifest.config.js       MV3 manifest (built by @crxjs)
├── vite.config.js
├── public/icons/            16/48/128 px
└── src/
    ├── background/
    │   └── background.js    orchestrates fetch -> summarize -> cache
    ├── popup/
    │   ├── App.jsx          repo detection, generate, result
    │   ├── Settings.jsx     API key, model, GitHub token
    │   └── popup.css
    └── shared/
        ├── github.js        URL parsing + repo snapshot
        ├── groq.js          prompt + chat completion
        ├── constants.js     models, filters, limits
        └── storage.js       settings + per-repo doc cache
```

## Errors you might see

| Message                          | Meaning                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| *Invalid Groq API key*           | Key is wrong or revoked — recheck it in Settings              |
| *Rate limited by Groq*           | Too many requests, wait a moment                             |
| *GitHub rate limit reached*      | 60/hour anonymous limit hit — add a GitHub token in Settings  |
| *Repository not found*           | Private repo (needs a token) or a typo'd URL                  |

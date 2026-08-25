import { useCallback, useEffect, useState } from 'react'
import { parseRepoUrl } from '../shared/github.js'
import { docsKey, getDocs, getSettings } from '../shared/storage.js'
import Settings from './Settings.jsx'

export default function App() {
  const [repo, setRepo] = useState(null)
  const [docs, setDocs] = useState(null)
  const [hasKey, setHasKey] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ready, setReady] = useState(false)

  // Work out which repo we're on, whether a key is set, and whether we already
  // have (or are mid-) generation for it.
  useEffect(() => {
    async function init() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const current = parseRepoUrl(tab?.url)
      setRepo(current)

      const { groqApiKey } = await getSettings()
      setHasKey(Boolean(groqApiKey))
      if (!groqApiKey) setShowSettings(true)

      if (current) setDocs(await getDocs(current.owner, current.repo))
      setReady(true)
    }

    init()
  }, [])

  // The worker keeps running after the popup closes, so watch storage rather
  // than relying on the message response surviving.
  useEffect(() => {
    if (!repo) return undefined

    const key = docsKey(repo.owner, repo.repo)
    const onChanged = (changes, area) => {
      if (area === 'local' && changes[key]) setDocs(changes[key].newValue)
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [repo])

  const handleGenerate = useCallback(() => {
    if (!repo) return

    setDocs({ status: 'running' })
    chrome.runtime.sendMessage({ type: 'GENERATE_DOCS', ...repo }, (result) => {
      if (chrome.runtime.lastError) return // popup closed; storage has the result
      if (result) setDocs(result)
    })
  }, [repo])

  async function handleCopy() {
    await navigator.clipboard.writeText(docs.readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDownload() {
    // Blob + anchor rather than chrome.downloads, so the extension doesn't need
    // the 'downloads' permission just to save a few KB of markdown.
    const blob = new Blob([docs.readme], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'README.md'
    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  if (!ready) return null

  const running = docs?.status === 'running'

  return (
    <div className="popup">
      <header className="header">
        <div>
          <h1>Scribe</h1>
          {repo ? (
            <p className="sub">
              {repo.owner}/<strong>{repo.repo}</strong>
            </p>
          ) : (
            <p className="sub">Open a GitHub repository</p>
          )}
        </div>
        <button type="button" className="ghost" onClick={() => setShowSettings((show) => !show)}>
          {showSettings ? 'Close' : 'Settings'}
        </button>
      </header>

      {showSettings && (
        <Settings
          onDone={async () => {
            const { groqApiKey } = await getSettings()
            setHasKey(Boolean(groqApiKey))
            if (groqApiKey) setShowSettings(false)
          }}
        />
      )}

      {!showSettings && (
        <>
          {!hasKey && <p className="note">Add a Groq API key in Settings to get started.</p>}

          <button
            type="button"
            className="primary wide"
            onClick={handleGenerate}
            disabled={!repo || !hasKey || running}
          >
            {running ? 'Reading the repo…' : docs?.readme ? 'Regenerate' : 'Generate README'}
          </button>

          {running && <p className="note">Fetching files, then summarizing. Takes a few seconds.</p>}

          {docs?.status === 'error' && <p className="error">{docs.error}</p>}

          {docs?.status === 'done' && docs.readme && (
            <section className="result">
              <div className="result-head">
                <span>
                  {docs.stats.analyzed} of {docs.stats.files} files · {docs.stats.language}
                </span>
                <div className="actions">
                  <button type="button" className="ghost" onClick={handleCopy}>
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleDownload}
                    title="Download as README.md"
                    aria-label="Download as README.md"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>
              <pre className="readme">{docs.readme}</pre>
            </section>
          )}
        </>
      )}
    </div>
  )
}

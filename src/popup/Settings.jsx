import { useCallback, useEffect, useState } from 'react'
import { MODELS, DEFAULT_MODEL } from '../shared/constants.js'
import { listModels } from '../shared/groq.js'
import { getSettings, saveSettings } from '../shared/storage.js'

const FALLBACK_IDS = MODELS.map((model) => model.id)

export default function Settings({ onDone }) {
  const [apiKey, setApiKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [available, setAvailable] = useState(FALLBACK_IDS)
  const [modelsError, setModelsError] = useState(null)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  // Groq retires models periodically, so ask the key what it can actually use
  // rather than trusting a hardcoded list.
  const refreshModels = useCallback(async (key) => {
    if (!key) return

    setLoadingModels(true)
    setModelsError(null)
    try {
      const ids = await listModels(key)
      if (ids.length > 0) setAvailable(ids)
    } catch (error) {
      setModelsError(error.message)
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    getSettings().then((settings) => {
      setApiKey(settings.groqApiKey)
      setGithubToken(settings.githubToken)
      setModel(settings.model)
      setLoaded(true)
      refreshModels(settings.groqApiKey)
    })
  }, [refreshModels])

  async function handleSave(event) {
    event.preventDefault()
    await saveSettings({ groqApiKey: apiKey.trim(), githubToken: githubToken.trim(), model })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onDone?.()
    }, 900)
  }

  if (!loaded) return null

  // Keep the saved model selectable even if Groq no longer lists it, so the
  // dropdown never silently changes what you picked.
  const options = available.includes(model) ? available : [model, ...available]
  const unavailable = available.length > 0 && !available.includes(model)

  return (
    <form onSubmit={handleSave} className="form">
      <label className="field">
        <span>Groq API key</span>
        <input
          type="password"
          placeholder="gsk_..."
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          onBlur={(event) => refreshModels(event.target.value.trim())}
          autoComplete="off"
          spellCheck={false}
        />
        <small>
          Free key at{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
        </small>
      </label>

      <label className="field">
        <span>
          Model{' '}
          <button
            type="button"
            className="ghost inline"
            onClick={() => refreshModels(apiKey.trim())}
            disabled={!apiKey || loadingModels}
          >
            {loadingModels ? 'checking…' : 'refresh'}
          </button>
        </span>
        <select value={model} onChange={(event) => setModel(event.target.value)}>
          {options.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        {unavailable && <small className="warn">Your key can't use this model — pick another.</small>}
        {modelsError && <small className="warn">Couldn't load models: {modelsError}</small>}
        {!modelsError && !unavailable && (
          <small>{available.length} models available to this key.</small>
        )}
      </label>

      <label className="field">
        <span>GitHub token (optional)</span>
        <input
          type="password"
          placeholder="ghp_..."
          value={githubToken}
          onChange={(event) => setGithubToken(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <small>Needed for private repos, and lifts the 60 requests/hour limit.</small>
      </label>

      <div className="row">
        <button type="submit" className="primary">
          Save
        </button>
        {saved && <span className="ok">Saved ✓</span>}
      </div>
    </form>
  )
}

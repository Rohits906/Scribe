import { buildRepoSnapshot } from '../shared/github.js'
import { generateReadme } from '../shared/groq.js'
import { getSettings, setDocs } from '../shared/storage.js'

/** Repos currently being generated, so a second click doesn't start a duplicate run. */
const inFlight = new Set()

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'GENERATE_DOCS') return undefined

  const { owner, repo } = message

  generate(owner, repo)
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ status: 'error', error: error.message }))

  return true // keep the message channel open for the async sendResponse above
})

async function generate(owner, repo) {
  const key = `${owner}/${repo}`

  if (inFlight.has(key)) {
    return { status: 'running' }
  }

  inFlight.add(key)
  // Written to storage so the popup can pick the run back up after it closes —
  // Chrome tears the popup down whenever it loses focus, but this worker keeps going.
  await setDocs(owner, repo, { status: 'running', startedAt: Date.now() })

  try {
    const { groqApiKey, githubToken, model } = await getSettings()

    const snapshot = await buildRepoSnapshot(owner, repo, githubToken)
    const readme = await generateReadme({ snapshot, apiKey: groqApiKey, model })

    const result = {
      status: 'done',
      readme,
      stats: {
        files: snapshot.totalFiles,
        analyzed: snapshot.paths.length,
        language: snapshot.language,
        model,
      },
      updatedAt: Date.now(),
    }

    await setDocs(owner, repo, result)
    return result
  } catch (error) {
    const result = { status: 'error', error: error.message, updatedAt: Date.now() }
    await setDocs(owner, repo, result)
    return result
  } finally {
    inFlight.delete(key)
  }
}

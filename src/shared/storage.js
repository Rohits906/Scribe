import { DEFAULT_MODEL } from './constants.js'

const DEFAULTS = {
  groqApiKey: '',
  githubToken: '',
  model: DEFAULT_MODEL,
}

export async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULTS)
  return { ...DEFAULTS, ...stored }
}

export async function saveSettings(partialSettings) {
  await chrome.storage.local.set(partialSettings)
}

/** Generated docs are cached per repo so reopening the popup doesn't mean regenerating. */
export const docsKey = (owner, repo) => `docs:${owner}/${repo}`

export async function getDocs(owner, repo) {
  const key = docsKey(owner, repo)
  const stored = await chrome.storage.local.get(key)
  return stored[key] ?? null
}

export async function setDocs(owner, repo, value) {
  await chrome.storage.local.set({ [docsKey(owner, repo)]: value })
}

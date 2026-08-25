import { GROQ_ENDPOINT, MODELS_ENDPOINT } from './constants.js'

const SYSTEM_PROMPT = `You are a senior engineer who writes excellent README files.
You will be given a factual snapshot of a GitHub repository: metadata, its file tree,
dependency manifests, entry-point source files, and possibly an existing README.

Write a README in GitHub-flavored Markdown. Rules:
- Describe only what the evidence supports. Never invent features, benchmarks, or URLs.
- If something (like install steps) can't be determined, infer it from the manifests or omit it.
- Be concise and concrete. No marketing language, no filler.
- Start with "# <repo name>" and a one-sentence description.
- Then, as they apply: Overview, Features, Tech stack, Project structure, Getting started
  (install/run commands taken from the manifests), Configuration, and License.
- Output only the Markdown. No preamble, no code fence around the whole document.`

function buildUserPrompt(snapshot) {
  const sections = [
    `Repository: ${snapshot.owner}/${snapshot.repo}`,
    `Primary language: ${snapshot.language}`,
    snapshot.description && `GitHub description: ${snapshot.description}`,
    snapshot.topics.length > 0 && `Topics: ${snapshot.topics.join(', ')}`,
    snapshot.license && `License: ${snapshot.license}`,
    snapshot.homepage && `Homepage: ${snapshot.homepage}`,
    `Default branch: ${snapshot.defaultBranch}`,
    `Total files: ${snapshot.totalFiles}`,
    '',
    `## File tree (${snapshot.paths.length} paths${snapshot.truncatedPaths ? ', truncated' : ''})`,
    snapshot.paths.join('\n'),
  ]

  for (const manifest of snapshot.manifests) {
    sections.push('', `## ${manifest.path}`, '```', manifest.content, '```')
  }

  for (const entry of snapshot.entryPoints) {
    sections.push('', `## ${entry.path}`, '```', entry.content, '```')
  }

  if (snapshot.existingReadme) {
    sections.push(
      '',
      '## Existing README (for context — write a fresh, better one)',
      snapshot.existingReadme,
    )
  }

  return sections.filter(Boolean).join('\n')
}

async function describeGroqError(response) {
  if (response.status === 401) {
    return 'Invalid Groq API key. Check it in Settings.'
  }
  if (response.status === 429) {
    return 'Rate limited by Groq. Wait a moment and try again.'
  }

  try {
    const body = await response.json()
    if (body?.error?.message) return body.error.message
  } catch {
    // Body wasn't JSON — fall through to the generic message below.
  }

  return `Groq API error (${response.status}). Please try again.`
}

/** Models that are not chat completions — they would only clutter the picker. */
const NON_CHAT_MODEL = /whisper|tts|guard|embed|moderation|prompt-guard/i

/** Asks Groq which models this key can actually use. */
export async function listModels(apiKey) {
  if (!apiKey) throw new Error('Add a Groq API key first.')

  const response = await fetch(MODELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) throw new Error(await describeGroqError(response))

  const data = await response.json()

  return (data?.data ?? [])
    .map((model) => model.id)
    .filter((id) => id && !NON_CHAT_MODEL.test(id))
    .sort()
}

export async function generateReadme({ snapshot, apiKey, model }) {
  if (!apiKey) {
    throw new Error('No Groq API key set. Open Settings in the popup to add one.')
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(snapshot) },
      ],
    }),
  })

  if (!response.ok) throw new Error(await describeGroqError(response))

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content?.trim()

  if (!content) throw new Error('Groq returned an empty response. Try again.')

  // Models sometimes fence the whole document despite being told not to.
  return content.replace(/^```(?:markdown|md)?\n/i, '').replace(/\n```$/, '')
}

export { buildUserPrompt }

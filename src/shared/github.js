import {
  ENTRY_POINT_PATTERNS,
  GITHUB_API,
  MANIFEST_FILES,
  MAX_ENTRY_POINTS,
  MAX_FILE_CHARS,
  MAX_MANIFESTS,
  MAX_README_CHARS,
  MAX_TREE_PATHS,
  SOURCE_EXTENSIONS,
  isInterestingPath,
} from './constants.js'

/** Pulls owner/repo out of a github.com URL, or null if it isn't a repo page. */
export function parseRepoUrl(url) {
  if (!url) return null

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.hostname !== 'github.com') return null

  const [owner, repo] = parsed.pathname.split('/').filter(Boolean)
  if (!owner || !repo) return null

  // Reserved paths that look like a repo but aren't.
  const reserved = ['settings', 'notifications', 'orgs', 'topics', 'explore', 'marketplace', 'sponsors']
  if (reserved.includes(owner)) return null

  return { owner, repo: repo.replace(/\.git$/, '') }
}

async function ghFetch(path, token) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${GITHUB_API}${path}`, { headers })

  if (!response.ok) throw new Error(await describeGithubError(response))

  return response.json()
}

async function describeGithubError(response) {
  if (response.status === 404) {
    return 'Repository not found. Private repos need a GitHub token in Settings.'
  }
  if (response.status === 401) {
    return 'GitHub rejected the token. Check it in Settings.'
  }
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (remaining === '0') {
      return 'GitHub rate limit reached (60 requests/hour without a token). Add a GitHub token in Settings for 5,000/hour.'
    }
    return 'GitHub refused the request (403).'
  }

  try {
    const body = await response.json()
    if (body?.message) return `GitHub: ${body.message}`
  } catch {
    // Not JSON — fall through.
  }

  return `GitHub API error (${response.status}).`
}

/** base64 (possibly newline-wrapped, possibly UTF-8) -> string */
function decodeContent(base64) {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

async function fetchFile(owner, repo, path, token, maxChars = MAX_FILE_CHARS) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, token)
    if (!data?.content) return null

    const text = decodeContent(data.content)
    return text.length > maxChars ? `${text.slice(0, maxChars)}\n... (truncated)` : text
  } catch {
    // A single unreadable file shouldn't sink the whole run.
    return null
  }
}

/**
 * Gathers everything the model needs to describe a repo: metadata, the file
 * tree, dependency manifests, any existing README, and a couple of entry points.
 */
export async function buildRepoSnapshot(owner, repo, token) {
  const meta = await ghFetch(`/repos/${owner}/${repo}`, token)

  const treeData = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
    token,
  )

  const allFiles = (treeData.tree ?? []).filter((node) => node.type === 'blob')
  const paths = allFiles.map((node) => node.path).filter(isInterestingPath)
  const visiblePaths = paths.slice(0, MAX_TREE_PATHS)

  const manifestPaths = MANIFEST_FILES.filter((name) => paths.includes(name)).slice(0, MAX_MANIFESTS)
  let entryPaths = paths
    .filter((path) => ENTRY_POINT_PATTERNS.some((pattern) => pattern.test(path)))
    .slice(0, MAX_ENTRY_POINTS)

  // Plenty of repos don't have a conventionally named entry point. Rather than
  // send the model a bare file list, fall back to the shallowest source files.
  if (entryPaths.length === 0) {
    entryPaths = paths
      .filter((path) => SOURCE_EXTENSIONS.test(path))
      .sort((a, b) => a.split('/').length - b.split('/').length || a.length - b.length)
      .slice(0, MAX_ENTRY_POINTS)
  }

  const readmePath = paths.find((path) => /^readme(\.md|\.rst|\.txt)?$/i.test(path))

  const [manifests, entryPoints, existingReadme] = await Promise.all([
    Promise.all(manifestPaths.map(async (path) => ({ path, content: await fetchFile(owner, repo, path, token) }))),
    Promise.all(entryPaths.map(async (path) => ({ path, content: await fetchFile(owner, repo, path, token) }))),
    readmePath ? fetchFile(owner, repo, readmePath, token, MAX_README_CHARS) : Promise.resolve(null),
  ])

  return {
    owner,
    repo,
    description: meta.description ?? '',
    language: meta.language ?? 'unknown',
    topics: meta.topics ?? [],
    stars: meta.stargazers_count ?? 0,
    license: meta.license?.spdx_id ?? null,
    homepage: meta.homepage ?? '',
    defaultBranch: meta.default_branch,
    totalFiles: allFiles.length,
    paths: visiblePaths,
    truncatedPaths: paths.length > visiblePaths.length,
    manifests: manifests.filter((file) => file.content),
    entryPoints: entryPoints.filter((file) => file.content),
    existingReadme,
  }
}

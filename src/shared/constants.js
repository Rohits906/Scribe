export const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (best quality)' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (fastest)' },
]

export const DEFAULT_MODEL = MODELS[0].id

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
export const MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models'
export const GITHUB_API = 'https://api.github.com'

/** Directories that are never worth showing the model. */
const IGNORED_DIRS =
  /(^|\/)(node_modules|dist|build|out|target|vendor|\.git|\.next|\.nuxt|__pycache__|coverage|\.venv|venv)\//

/** Binary/lock/noise files — they eat tokens and say nothing about the design. */
const IGNORED_FILES =
  /\.(png|jpe?g|gif|svg|ico|webp|mp4|mp3|woff2?|ttf|eot|pdf|zip|gz|lock|min\.js|map)$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Gemfile\.lock)$/i

export function isInterestingPath(path) {
  return !IGNORED_DIRS.test(path) && !IGNORED_FILES.test(path)
}

/** Dependency manifests, in the order we'd like to show them. */
export const MANIFEST_FILES = [
  'package.json',
  'requirements.txt',
  'pyproject.toml',
  'go.mod',
  'Cargo.toml',
  'composer.json',
  'Gemfile',
  'pom.xml',
  'build.gradle',
  'Dockerfile',
  'docker-compose.yml',
]

/** Likely entry points — reading a couple of these grounds the summary in real code. */
export const ENTRY_POINT_PATTERNS = [
  /^((src|lib|app)\/)?(index|main|app|server|cli)\.(js|jsx|ts|tsx|py|go|rs|rb|java)$/i,
  /^(src\/)?app\/(page|layout)\.(js|jsx|ts|tsx)$/i,
  /^(main|manage)\.py$/i,
]

/** Used to pick fallback files when no entry point pattern matches. */
export const SOURCE_EXTENSIONS = /\.(js|jsx|ts|tsx|py|go|rs|rb|java|php|cs|kt|swift|c|cpp|h)$/i

export const MAX_TREE_PATHS = 400
export const MAX_MANIFESTS = 3
export const MAX_ENTRY_POINTS = 3
export const MAX_FILE_CHARS = 3500
export const MAX_README_CHARS = 2500

// Words, glyphs and arithmetic for the theme. Nothing here touches the mods API.

export const COLOR = {
  red: '#FF5555',
  darkRed: '#AA0000',
  green: '#55FF55',
  xp: '#80FF20',
  yellow: '#FFFF55',
  gold: '#FFAA00',
  gray: '#AAAAAA',
  darkGray: '#555555',
  white: '#FFFFFF',
  stone: '#C6C6C6',
  purple: '#FF55FF',
  aqua: '#55FFFF',
  emerald: '#17DD62',
  slot: '#3A3A3A',
  black: '#000000',
}

export const SPLASHES = [
  'Also try reading the logs!',
  'Now with more redstone!',
  '100% pure tool calls!',
  'Punching trees since turn one!',
  'Creepers hate passing tests!',
  'Technically a sandbox game!',
  'Mine first, craft later!',
  'May contain flaky tests!',
  'Never dig straight down!',
  'Sleep resets the context!',
]

// A stable pick: the same text always lands on the same entry, so a row keeps
// its wording across redraws.
export function pick<T>(list: readonly T[], seed: string): T {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return list[hash % list.length] as T
}

const TOOL_WORDS: Record<string, string> = {
  Grep: 'Mining',
  Glob: 'Digging',
  Read: 'Reading book and quill',
  Edit: 'Crafting',
  Write: 'Crafting',
  NotebookEdit: 'Crafting',
  Bash: 'Wiring redstone',
  WebSearch: 'Exploring',
  WebFetch: 'Exploring',
  Agent: 'Trading with villager',
  Task: 'Trading with villager',
  Skill: 'Enchanting',
  TodoWrite: 'Writing signs',
  AskUserQuestion: 'Ringing the village bell',
}

const MODE_WORDS: Record<string, readonly string[]> = {
  thinking: ['Enchanting', 'Brewing', 'Smelting'],
  requesting: ['Loading chunks', 'Generating terrain'],
  responding: ['Writing in book', 'Placing blocks'],
  'tool-input': ['Gathering materials', 'Sharpening pickaxe'],
  'tool-use': ['Mining', 'Building'],
}

export function spinnerWord(tool: string | undefined, mode: string, seed: string): string {
  let word: string
  if (tool && tool.startsWith('mcp__')) word = 'Opening chest'
  else if (tool && TOOL_WORDS[tool]) word = TOOL_WORDS[tool] as string
  else word = pick(MODE_WORDS[mode] ?? MODE_WORDS['tool-use']!, seed)
  return '⛏ ' + word
}

const PAST_WORDS = ['Mined', 'Crafted', 'Smelted', 'Enchanted', 'Brewed', 'Built', 'Farmed']

export function pastWord(seed: string): string {
  return pick(PAST_WORDS, seed)
}

const TOOL_GLYPHS: Record<string, string> = {
  Grep: '⛏',
  Glob: '⛏',
  Read: '📖',
  Edit: '🔨',
  Write: '🔨',
  NotebookEdit: '🔨',
  Bash: '🔴',
  WebSearch: '🧭',
  WebFetch: '🧭',
  Agent: '👤',
  Task: '👤',
  Skill: '✨',
  TodoWrite: '📜',
}

export function toolGlyph(tool: string): string {
  if (tool.startsWith('mcp__')) return '📦'
  return TOOL_GLYPHS[tool] ?? '🧱'
}

// What a tool call reads as in chat, the way the game reports an operator's
// command: `ran pytest -q` inside `[Claude: ran pytest -q]`.
export function chatAction(tool: string, input: unknown, root: string): string {
  const given = (input ?? {}) as Record<string, unknown>
  const text = (key: string) => (typeof given[key] === 'string' ? (given[key] as string) : '')
  const short = (value: string, most = 72) => {
    const line = (value.split('\n')[0] ?? '').trim()
    return line.length > most ? line.slice(0, most - 1) + '…' : line
  }
  const path = (value: string) => (root && value.startsWith(root + '/') ? value.slice(root.length + 1) : value)
  if (tool === 'Bash') return 'ran ' + short(text('command'))
  if (tool === 'Read') return 'read ' + path(text('file_path'))
  if (tool === 'Edit' || tool === 'NotebookEdit') return 'edited ' + path(text('file_path') || text('notebook_path'))
  if (tool === 'Write') return 'wrote ' + path(text('file_path'))
  if (tool === 'Grep') return 'searched for ' + short(text('pattern'), 40)
  if (tool === 'Glob') return 'looked for ' + short(text('pattern'), 40)
  if (tool === 'Agent' || tool === 'Task') return 'sent a villager to ' + short(text('description') || 'help', 48)
  if (tool === 'Skill') return 'used the skill ' + text('skill')
  if (tool === 'WebFetch') return 'fetched ' + short(text('url'), 60)
  if (tool === 'WebSearch') return 'searched the web for ' + short(text('query'), 48)
  if (tool.startsWith('mcp__')) return 'used ' + tool.split('__').slice(1).join(' ')
  return 'used ' + tool
}

const DEATHS = [
  'fell from a high place',
  'was blown up by Creeper',
  'tried to swim in lava',
  'was slain by Zombie',
  'hit the ground too hard',
  'fell out of the world',
  'was shot by Skeleton',
  'withered away',
  'was pricked to death',
  'suffocated in a wall',
  'was struck by lightning',
  'walked into a cactus',
]

// The first word of a shell command that is not an env assignment: `pytest`
// for `FOO=1 pytest -q tests/`.
export function commandName(command: string): string {
  for (const word of command.trim().split(/\s+/)) {
    if (word === '' || /^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) continue
    return word.split('/').pop() || word
  }
  return ''
}

export function deathMessage(tool: string, subject: string, text: string, seed: string): string {
  const who = subject || tool
  if (/interrupt/i.test(text)) return who + ' left the game'
  if (/doesn't want to proceed|was rejected|permission.*denied|denied by/i.test(text)) {
    return who + ' was kicked by an operator'
  }
  let detail = ''
  const failed = /(\d+) failed/.exec(text)
  const exit = /exit code (\d+)/i.exec(text)
  if (failed) detail = ' (' + failed[1] + ' failed)'
  else if (exit) detail = ' (exit ' + exit[1] + ')'
  else if (/no such file|does not exist|not found/i.test(text)) detail = ' (not found)'
  else if (/timed? ?out/i.test(text)) detail = ' (timed out)'
  return who + ' ' + pick(DEATHS, seed) + detail
}

export function isTestCommand(command: string): boolean {
  return /\b(pytest|go test|cargo test|npm (run )?test|pnpm (run )?test|yarn test|jest|vitest|tox|just \S*test\S*|make \S*test\S*)\b/.test(
    command,
  )
}

export type Tab = 'Story' | 'Nether' | 'The End' | 'Adventure' | 'Husbandry'

// The game's three frames: a task is a step, a goal a milestone, a challenge
// one of the hard ones. `after` names the advancement this one hangs under on
// the screen; it can still be earned first, as in the game. A hidden one is
// not shown until it is earned. `xp` is paid once, when it is earned.
export type Advancement = {
  id: string
  title: string
  how: string
  icon: string
  tab: Tab
  frame: 'task' | 'goal' | 'challenge'
  after?: string
  isHidden?: boolean
  xp?: number
}

export const ADVANCEMENTS = {
  stoneAge: { id: "stoneAge", title: "Stone Age", how: "Edit a file", icon: "🧱", tab: "Story", frame: "task" },
  upgrade: { id: "upgrade", title: "Getting an Upgrade", how: "Get a green test run", icon: "🔰", tab: "Story", frame: "task", after: "stoneAge" },
  acquireHardware: { id: "acquireHardware", title: "Acquire Hardware", how: "Get a build to succeed", icon: "🔩", tab: "Story", frame: "task", after: "upgrade" },
  suitUp: { id: "suitUp", title: "Suit Up", how: "Pass a linter or a type checker", icon: "🦺", tab: "Story", frame: "task", after: "acquireHardware" },
  notToday: { id: "notToday", title: "Not Today, Thank You", how: "Clear a problem a linter or type checker caught", icon: "🧿", tab: "Story", frame: "task", after: "suitUp" },
  furiousCocktail: { id: "furiousCocktail", title: "A Furious Cocktail", how: "Have tests, checks and the build all green since the last edit", icon: "🧪", tab: "Story", frame: "challenge", after: "notToday", xp: 30 },
  howDidWe: { id: "howDidWe", title: "How Did We Get Here?", how: "In one session: every check green, a verified commit, a push, a pull request, a subagent, a web lookup and a skill or MCP call", icon: "🌀", tab: "Story", frame: "challenge", after: "furiousCocktail", isHidden: true, xp: 100 },
  ironPick: { id: "ironPick", title: "Isn't It Iron Pick", how: "Make a git commit", icon: "🪓", tab: "Story", frame: "task", after: "acquireHardware" },
  diamonds: { id: "diamonds", title: "Diamonds!", how: "Commit with the tests green and nothing edited since", icon: "💎", tab: "Story", frame: "task", after: "ironPick" },
  coverMe: { id: "coverMe", title: "Cover Me with Diamonds", how: "Make 25 verified commits", icon: "👑", tab: "Story", frame: "goal", after: "diamonds", xp: 15 },
  coverMeInDebris: { id: "coverMeInDebris", title: "Cover Me in Debris", how: "Make 250 verified commits", icon: "🌑", tab: "Story", frame: "challenge", after: "coverMe", xp: 100 },
  enchanter: { id: "enchanter", title: "Enchanter", how: "Use a skill", icon: "📕", tab: "Story", frame: "task", after: "diamonds" },
  hotStuff: { id: "hotStuff", title: "Hot Stuff", how: "Push your commits", icon: "🔥", tab: "Story", frame: "task", after: "ironPick" },
  iceBucket: { id: "iceBucket", title: "Ice Bucket Challenge", how: "Resolve a merge conflict", icon: "🧊", tab: "Story", frame: "task", after: "hotStuff" },
  eyeSpy: { id: "eyeSpy", title: "Eye Spy", how: "Start a new branch", icon: "👀", tab: "Story", frame: "task", after: "iceBucket" },
  zombieDoctor: { id: "zombieDoctor", title: "Zombie Doctor", how: "Get a broken tool working again", icon: "💉", tab: "Story", frame: "goal", after: "stoneAge", xp: 15 },
  deeper: { id: "deeper", title: "We Need to Go Deeper", how: "Send out a subagent", icon: "🌋", tab: "Nether", frame: "task" },
  subspaceBubble: { id: "subspaceBubble", title: "Subspace Bubble", how: "Send out 3 subagents in one turn", icon: "🫧", tab: "Nether", frame: "goal", after: "deeper" },
  feelsLikeHome: { id: "feelsLikeHome", title: "Feels Like Home", how: "Send out 100 subagents", icon: "🏠", tab: "Nether", frame: "goal", after: "subspaceBubble", xp: 15 },
  thoseWereTheDays: { id: "thoseWereTheDays", title: "Those Were the Days", how: "Read the history: git blame, log search or show", icon: "🏚", tab: "Nether", frame: "task", after: "deeper" },
  hiddenInTheDepths: { id: "hiddenInTheDepths", title: "Hidden in the Depths", how: "Find the first bad commit with git bisect", icon: "🪨", tab: "Nether", frame: "goal", after: "thoseWereTheDays", xp: 15 },
  returnToSender: { id: "returnToSender", title: "Return to Sender", how: "Revert a commit", icon: "📮", tab: "Nether", frame: "task", after: "thoseWereTheDays" },
  totalBeelocation: { id: "totalBeelocation", title: "Total Beelocation", how: "Rebase a branch onto a new base", icon: "🐝", tab: "Nether", frame: "task", after: "thoseWereTheDays" },
  theEnd: { id: "theEnd", title: "The End?", how: "Open a pull request", icon: "🌌", tab: "The End", frame: "task" },
  freeTheEnd: { id: "freeTheEnd", title: "Free the End", how: "Merge a pull request", icon: "🐉", tab: "The End", frame: "task", after: "theEnd" },
  nextGeneration: { id: "nextGeneration", title: "The Next Generation", how: "Open 10 pull requests", icon: "🥚", tab: "The End", frame: "goal", after: "freeTheEnd", xp: 15 },
  theEndAgain: { id: "theEndAgain", title: "The End... Again...", how: "Open 50 pull requests", icon: "🔁", tab: "The End", frame: "goal", after: "nextGeneration", xp: 15 },
  greatView: { id: "greatView", title: "Great View From Up Here", how: "Merge 10 pull requests", icon: "🔭", tab: "The End", frame: "challenge", after: "freeTheEnd", xp: 30 },
  remoteGetaway: { id: "remoteGetaway", title: "Remote Getaway", how: "Open pull requests in 3 repositories", icon: "🏝", tab: "The End", frame: "task", after: "freeTheEnd" },
  cityAtTheEnd: { id: "cityAtTheEnd", title: "The City at the End of the Game", how: "Cut a release", icon: "🏙", tab: "The End", frame: "task", after: "remoteGetaway" },
  monsterHunter: { id: "monsterHunter", title: "Monster Hunter", how: "Turn a red test run green", icon: "🧟", tab: "Adventure", frame: "task" },
  takeAim: { id: "takeAim", title: "Take Aim", how: "Run one targeted test", icon: "🎯", tab: "Adventure", frame: "task", after: "monsterHunter" },
  sniperDuel: { id: "sniperDuel", title: "Sniper Duel", how: "Go green on the first test run after an edit", icon: "🏹", tab: "Adventure", frame: "goal", after: "takeAim", xp: 15 },
  bullseye: { id: "bullseye", title: "Bullseye", how: "Go green on the first run 10 times in a row", icon: "🟡", tab: "Adventure", frame: "challenge", after: "sniperDuel", xp: 30 },
  monstersHunted: { id: "monstersHunted", title: "Monsters Hunted", how: "Turn 100 red test runs green", icon: "💀", tab: "Adventure", frame: "challenge", after: "monsterHunter", xp: 50 },
  overOverkill: { id: "overOverkill", title: "Over-Overkill", how: "Pass 500 or more tests in one run", icon: "🔨", tab: "Adventure", frame: "goal", after: "monsterHunter" },
  heroOfTheVillage: { id: "heroOfTheVillage", title: "Hero of the Village", how: "Bring a run with 20 or more failures back to green", icon: "🏅", tab: "Adventure", frame: "challenge", after: "monsterHunter", isHidden: true, xp: 30 },
  arbalistic: { id: "arbalistic", title: "Arbalistic", how: "Edit 5 or more files, then go green on the first run", icon: "🎇", tab: "Adventure", frame: "challenge", after: "sniperDuel", isHidden: true, xp: 30 },
  postmortal: { id: "postmortal", title: "Postmortal", how: "Go green on your edits after a compaction", icon: "🗿", tab: "Adventure", frame: "goal", after: "monsterHunter", xp: 15 },
  cavesAndCliffs: { id: "cavesAndCliffs", title: "Caves & Cliffs", how: "Fill 90% of the context window", icon: "🗻", tab: "Adventure", frame: "task" },
  stickySituation: { id: "stickySituation", title: "Sticky Situation", how: "Make a verified commit with 95% of the context used", icon: "🍯", tab: "Adventure", frame: "task", after: "cavesAndCliffs", isHidden: true },
  sneak100: { id: "sneak100", title: "Sneak 100", how: "Make 100 tool calls in a row with none failing", icon: "🥷", tab: "Adventure", frame: "goal" },
  isItABird: { id: "isItABird", title: "Is It a Bird?", how: "Search or fetch from the web", icon: "🔎", tab: "Adventure", frame: "task" },
  underLockAndKey: { id: "underLockAndKey", title: "Under Lock and Key", how: "Call an MCP server", icon: "🔑", tab: "Adventure", frame: "task" },
  revaulting: { id: "revaulting", title: "Revaulting", how: "Use 5 different MCP servers", icon: "🔐", tab: "Adventure", frame: "goal", after: "underLockAndKey", xp: 15 },
  sweetDreams: { id: "sweetDreams", title: "Sweet Dreams", how: "Come back to a repository on a later day", icon: "🛏", tab: "Adventure", frame: "task" },
  adventuringTime: { id: "adventuringTime", title: "Adventuring Time", how: "Work in 10 different repositories", icon: "🧭", tab: "Adventure", frame: "challenge", after: "sweetDreams", xp: 50 },
  countryLode: { id: "countryLode", title: "Country Lode, Take Me Home", how: "Edit a CLAUDE.md or AGENTS.md", icon: "🧲", tab: "Adventure", frame: "task" },
  craftersCrafting: { id: "craftersCrafting", title: "Crafters Crafting Crafters", how: "Edit an agent, skill, command or hook", icon: "🤖", tab: "Adventure", frame: "task", after: "countryLode" },
  aSeedyPlace: { id: "aSeedyPlace", title: "A Seedy Place", how: "Write a new test file and see it pass", icon: "🌱", tab: "Husbandry", frame: "task" },
  reapWhatYouSow: { id: "reapWhatYouSow", title: "Reap What You Sow", how: "Verify your edits with a green run 100 times", icon: "🌾", tab: "Husbandry", frame: "goal", after: "aSeedyPlace", xp: 15 },
  seriousDedication: { id: "seriousDedication", title: "Serious Dedication", how: "Verify your edits with a green run 1,000 times", icon: "🚜", tab: "Husbandry", frame: "challenge", after: "reapWhatYouSow", xp: 100 },
  aBalancedDiet: { id: "aBalancedDiet", title: "A Balanced Diet", how: "Edit code in 8 different languages", icon: "🍱", tab: "Husbandry", frame: "challenge", after: "aSeedyPlace", xp: 50 },
  glowAndBehold: { id: "glowAndBehold", title: "Glow and Behold!", how: "Write documentation", icon: "🪧", tab: "Husbandry", frame: "task" },
  bestFriendsForever: { id: "bestFriendsForever", title: "Best Friends Forever", how: "Work 7 different days in one repository", icon: "🐺", tab: "Husbandry", frame: "goal", xp: 15 },
  homesteader: { id: "homesteader", title: "Homesteader", how: "Work 7 days in a row", icon: "🏡", tab: "Husbandry", frame: "goal", after: "bestFriendsForever", xp: 15 },
  oldGrowth: { id: "oldGrowth", title: "Old Growth", how: "Work 30 days in a row", icon: "🌳", tab: "Husbandry", frame: "challenge", after: "homesteader", xp: 50 },
  passingTheTime: { id: "passingTheTime", title: "Passing the Time", how: "Work 100 days in total", icon: "⏳", tab: "Husbandry", frame: "challenge", after: "bestFriendsForever", xp: 100 },
  birthdaySong: { id: "birthdaySong", title: "Birthday Song", how: "Work on the anniversary of your first session", icon: "🎂", tab: "Husbandry", frame: "task", isHidden: true },
  plantingThePast: { id: "plantingThePast", title: "Planting the Past", how: "Go green in a repository you last touched 90 or more days ago", icon: "🏺", tab: "Husbandry", frame: "task", isHidden: true },
} satisfies Record<string, Advancement>

export const TABS: readonly Tab[] = ['Story', 'Nether', 'The End', 'Adventure', 'Husbandry']

// Lifetime counters and the advancements their totals earn
export const MILESTONES: Record<string, readonly (readonly [number, Advancement])[]> = {
  verifiedCommits: [[25, ADVANCEMENTS.coverMe], [250, ADVANCEMENTS.coverMeInDebris]],
  subagents: [[100, ADVANCEMENTS.feelsLikeHome]],
  prs: [[10, ADVANCEMENTS.nextGeneration], [50, ADVANCEMENTS.theEndAgain]],
  merges: [[10, ADVANCEMENTS.greatView]],
  redToGreen: [[100, ADVANCEMENTS.monstersHunted]],
  greens: [[100, ADVANCEMENTS.reapWhatYouSow], [1000, ADVANCEMENTS.seriousDedication]],
}

export function isBuildCommand(command: string): boolean {
  if (/\btsc\b/.test(command)) return !/--noEmit\b/.test(command)
  return /\b(cargo build|go build|(npm|pnpm) (run )?build|yarn build|mvn package|gradle\w* build|docker build|make( build| all)?\s*$)/.test(
    command,
  )
}

// A linter or a type checker
export function isCheckCommand(command: string): boolean {
  return /\b(eslint|ruff|mypy|pyright|flake8|pylint|clippy|go vet|golangci-lint|tsc\b.*--noEmit)\b/.test(command)
}

// A test command narrowed to one test or one file
export function isTargetedTest(command: string): boolean {
  return isTestCommand(command) && /(::| -k | -run | -t |--filter|\S+[._]test\.\w+|\S*test_\w+\.py|\.spec\.\w+)/.test(command)
}

export function isTestFile(path: string): boolean {
  return /(^|\/)(test_[^/]*\.py|[^/]*_test\.\w+|[^/]*\.(test|spec)\.\w+)$|(^|\/)tests?\/[^/]+$/.test(path)
}

export function isDocFile(path: string): boolean {
  if (/(^|\/)(CLAUDE|AGENTS|SKILL)\.md$/.test(path)) return false
  return /(^|\/)README[^/]*$|\.(md|rst)$/i.test(path)
}

const LANGUAGES: Record<string, string> = {
  py: 'Python', ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript',
  go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', rb: 'Ruby', c: 'C', h: 'C', cpp: 'C++', cc: 'C++', hpp: 'C++',
  cs: 'C#', swift: 'Swift', php: 'PHP', sh: 'Shell', bash: 'Shell', zsh: 'Shell', sql: 'SQL', lua: 'Lua',
  scala: 'Scala', ex: 'Elixir', exs: 'Elixir', hs: 'Haskell', dart: 'Dart', r: 'R', pl: 'Perl', tf: 'Terraform',
  html: 'HTML', css: 'CSS', scss: 'CSS',
}

// The language of a source file by its extension; undefined for data, docs
// and config
export function languageOf(path: string): string | undefined {
  const extension = /\.([A-Za-z0-9]+)$/.exec(path)?.[1]?.toLowerCase()
  return extension ? LANGUAGES[extension] : undefined
}

// The game mode a permission mode plays as
export function gameMode(labels: string): { name: string; color: string } {
  if (/bypass|dangerous/i.test(labels)) return { name: 'Hardcore', color: COLOR.red }
  if (/plan/i.test(labels)) return { name: 'Spectator', color: COLOR.gray }
  if (/accept/i.test(labels)) return { name: 'Creative', color: COLOR.aqua }
  if (/auto|dontAsk/i.test(labels)) return { name: 'Adventure', color: COLOR.gold }
  return { name: 'Survival', color: COLOR.green }
}

// The local calendar day of a clock reading, as 2026-10-03
export function dayOf(ms: number): string {
  const local = new Date(ms - new Date(ms).getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
}

// How many days in a row, ending today, are in the list
export function streakEnding(days: readonly string[], today: string): number {
  const have = new Set(days)
  let streak = 0
  let at = Date.parse(today)
  while (have.has(new Date(at).toISOString().slice(0, 10))) {
    streak += 1
    at -= 86400000
  }
  return streak
}

// A filled-and-empty bar of `width` cells for `done` out of `total`.
export function bar(done: number, total: number, width: number): { filled: string; empty: string } {
  const cells = total <= 0 ? 0 : Math.max(0, Math.min(width, Math.round((done / total) * width)))
  return { filled: '▰'.repeat(cells), empty: '▱'.repeat(width - cells) }
}

// Minecraft's own curve: each level costs more than the last.
function costOfLevel(level: number): number {
  if (level < 16) return 2 * level + 7
  if (level < 31) return 5 * level - 38
  return 9 * level - 158
}

export function levelOf(xp: number): { level: number; into: number; cost: number } {
  let level = 0
  let left = Math.max(0, Math.floor(xp))
  while (left >= costOfLevel(level)) {
    left -= costOfLevel(level)
    level += 1
  }
  return { level, into: left, cost: costOfLevel(level) }
}

// Ten hearts over twenty half-units, as the game counts health.
export function halves(percentLeft: number): number {
  return Math.max(0, Math.min(20, Math.ceil(percentLeft / 5)))
}

const FONT: Record<string, readonly string[]> = {
  C: ['111', '100', '100', '100', '111'],
  L: ['100', '100', '100', '100', '111'],
  A: ['111', '101', '111', '101', '101'],
  U: ['101', '101', '101', '101', '111'],
  D: ['110', '101', '101', '101', '110'],
  O: ['111', '101', '101', '101', '111'],
  E: ['111', '100', '111', '100', '111'],
  R: ['111', '101', '110', '101', '101'],
  F: ['111', '100', '111', '100', '100'],
  T: ['111', '010', '010', '010', '010'],
}

// The title in block letters: a five-row font packed into three rows of text
// with half blocks, two font rows to a text row.
export function logoRows(word: string): string[] {
  const rows = ['', '', '']
  for (const letter of word) {
    const glyph = FONT[letter]
    if (!glyph) continue
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const top = glyph[row * 2]?.[column] === '1'
        const bottom = glyph[row * 2 + 1]?.[column] === '1'
        rows[row] += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' '
      }
      rows[row] += ' '
    }
  }
  return rows
}

// A picture for the terminal's cell grid: its size in cells and the packed cells
export type Picture = { columns: number; rows: number; cells: string }

const CLEAR = 0x01000000

function base64(bytes: Uint8Array): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  for (let at = 0; at < bytes.length; at += 3) {
    const a = bytes[at] ?? 0
    const b = bytes[at + 1] ?? 0
    const c = bytes[at + 2] ?? 0
    out += letters[a >> 2]! + letters[((a & 3) << 4) | (b >> 4)]!
    out += at + 1 < bytes.length ? letters[((b & 15) << 2) | (c >> 6)]! : '='
    out += at + 2 < bytes.length ? letters[c & 63]! : '='
  }
  return out
}

// Packs rows of pixels (a color, or undefined for see-through) into cells: two
// pixel rows to a text row, drawn with half blocks.
export type Stamp = { text: string; row: number; column: number; color: number; back: number }

export function paint(pixels: (number | undefined)[][], stamps: Stamp[] = []): Picture {
  const columns = Math.max(...pixels.map(row => row.length))
  const rows = Math.ceil(pixels.length / 2)
  const words = new Uint32Array(columns * rows * 3)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const top = pixels[row * 2]?.[column]
      const bottom = pixels[row * 2 + 1]?.[column]
      const at = (row * columns + column) * 3
      if (top === undefined && bottom === undefined) words.set([0x20, CLEAR, CLEAR], at)
      else if (bottom === undefined) words.set([0x2580, top!, CLEAR], at)
      else if (top === undefined) words.set([0x2584, bottom, CLEAR], at)
      else words.set([0x2580, top, bottom], at)
    }
  }
  // Short labels written over cells, as a stack's count is
  for (const stamp of stamps) {
    ;[...stamp.text].forEach((letter, index) => {
      const column = stamp.column + index
      if (column < 0 || column >= columns || stamp.row >= rows) return
      words.set([letter.charCodeAt(0), stamp.color, stamp.back], (stamp.row * columns + column) * 3)
    })
  }
  return { columns, rows, cells: base64(new Uint8Array(words.buffer)) }
}

function sprite(art: string[], palette: Record<string, number>): Picture {
  return paint(art.map(row => [...row].map(letter => palette[letter])))
}

// The player's head, front on, as the game's default skin wears it
export const HEAD_PLAYER = sprite(['hhhhhh', 'hssssh', 'ssssss', 'wessew', 'ssnnss', 'smmmms'], {
  h: 0x2f1f0f,
  s: 0xbb8a66,
  w: 0xffffff,
  e: 0x4a3fb5,
  n: 0x8f5f44,
  m: 0x5a3622,
})

// Claude's head: a clay block with two eyes
export const HEAD_CLAUDE = sprite(['llllll', 'cccccc', 'ckcckc', 'cccccc', 'cckkcc', 'dddddd'], {
  l: 0xeaa083,
  c: 0xd97757,
  d: 0xa9553b,
  k: 0x2b1a14,
})

// What sits in a hotbar slot for each kind of tool, six pixels square: a dark
// outline, a lit side and a shaded one, as the game's item sprites have
const ITEM_COLORS: Record<string, number> = {
  d: 0x4aedd9, // diamond
  D: 0x1f9c8f,
  i: 0xb5fff5,
  s: 0x9a6a3a, // stick, wood
  S: 0x5c3a1c,
  r: 0xc81e10, // redstone
  R: 0xff4a36,
  q: 0x7a0c06,
  b: 0xa8452f, // brick
  B: 0x7d2f1f,
  m: 0x6e5a50, // mortar
  w: 0xf4f4f4, // paper, pages
  W: 0xc8c8c8,
  g: 0xa8a8a8, // iron, stone
  G: 0x6c6c6c,
  k: 0x2b2b2b,
  y: 0xffd83d, // gold
  p: 0xa85cf0, // enchanted
  P: 0x5a1f8f,
  e: 0x17dd62, // emerald
  E: 0x9cffc0,
  F: 0x0b8a3c,
  c: 0x8a5a36, // leather
  C: 0x4a2d14,
}
const ITEMS: Record<string, string[]> = {
  pickaxe: ['.DDDD.', 'DiddDD', '..SsdD', '.Ss.dD', 'Ss..D.', 'S.....'],
  book: ['.CCCC.', 'CccccW', 'CcCCcW', 'CccccW', 'CCCCCW', '.wwww.'],
  bricks: ['bbmbbb', 'BBmBBB', 'mmmmmm', 'bbbbmb', 'BBBBmB', 'mmmmmm'],
  redstone: ['......', '..R...', '.rRr..', 'qrRRr.', '.qrRRr', '..qqq.'],
  compass: ['.GGGG.', 'GkkkRG', 'GkkRkG', 'GkwkkG', 'GwkkkG', '.GGGG.'],
  emerald: ['..FF..', '.FEeF.', 'FEeeeF', 'FeeeeF', '.FeeF.', '..FF..'],
  enchanted: ['.PPPP.', 'PppppW', 'PpyypW', 'PpyypW', 'PPPPPW', '.wwww.'],
  chest: ['CCCCCC', 'CssssC', 'CCyyCC', 'CsyysC', 'CssssC', 'CCCCCC'],
  paper: ['.wwwW.', '.wGGw.', '.wwww.', '.wGGw.', '.wwww.', '.WWWW.'],
  stone: ['gggGgg', 'gGgggg', 'ggggGg', 'Gggggg', 'ggGggg', 'gggggG'],
}
const TOOL_ITEMS: Record<string, string> = {
  Grep: 'pickaxe',
  Glob: 'pickaxe',
  Read: 'book',
  Edit: 'bricks',
  Write: 'bricks',
  NotebookEdit: 'bricks',
  Bash: 'redstone',
  WebSearch: 'compass',
  WebFetch: 'compass',
  Agent: 'emerald',
  Task: 'emerald',
  Skill: 'enchanted',
  TodoWrite: 'paper',
}

// The item a tool holds in the hotbar, by its sprite's name
export function itemOf(tool: string): string {
  return tool.startsWith('mcp__') ? 'chest' : (TOOL_ITEMS[tool] ?? 'stone')
}

// The experience bar alone, one row: the level, then a thin notched bar
export function xpPicture(width: number, level: number, into: number, cost: number): Picture {
  const label = 'Lv ' + level + ' '
  const span = Math.max(1, width - label.length)
  const filled = cost <= 0 ? 0 : Math.max(0, Math.min(span, Math.round((into / cost) * span)))
  const top: (number | undefined)[] = new Array(width).fill(undefined)
  const bottom: (number | undefined)[] = new Array(width).fill(undefined)
  for (let x = 0; x < span; x++) {
    const isNotch = x % 8 === 7
    bottom[label.length + x] = x < filled ? (isNotch ? 0x4fa010 : 0x80ff20) : isNotch ? 0x1c1c1c : 0x3a3a3a
  }
  return paint([top, bottom], [{ text: label, row: 0, column: 0, color: 0x80ff20, back: CLEAR }])
}

// One hotbar slot, eight pixels square: the tool's item inside the slot's
// frame, its use count in the corner, and a white frame on the tool in hand
export function slotPicture(tool: string, uses: number, isHeld: boolean): Picture {
  const back = 0x2a2a2a
  const frame = isHeld ? 0xffffff : 0x7a7a7a
  const art = ITEMS[tool.startsWith('mcp__') ? 'chest' : (TOOL_ITEMS[tool] ?? 'stone')]!
  const edge = new Array(8).fill(frame)
  const pixels = [edge, ...art.map(row => [frame, ...[...row].map(letter => ITEM_COLORS[letter] ?? back), frame]), edge]
  // The count sits on the frame's corner, so the frame stays whole
  const count = String(uses)
  return paint(pixels, [{ text: count, row: 3, column: 8 - count.length, color: isHeld ? 0x000000 : 0xffffff, back: frame }])
}

// The HUD icons, three pixels wide: a heart and a drumstick are two tall, and
// an armor point is a single plate over its heart. `1` is the lit pixel, `2` the
// body, `3` the shaded one; a half heart keeps its left column
const HEART = ['1.2', '.3.']
const PLATE = ['122']
const DRUMSTICK = ['.12', 'b3.']
const TINTS = {
  heart: { '1': 0xff8a8a, '2': 0xff1a1a, '3': 0xb00c0c, b: 0, off: 0x4a1c1c },
  hurt: { '1': 0xffffff, '2': 0xffffff, '3': 0xdddddd, b: 0, off: 0x4a1c1c },
  plate: { '1': 0xf4f4f4, '2': 0xc4c4c4, '3': 0x8c8c8c, b: 0, off: 0x3a3a3a },
  food: { '1': 0xe89a4a, '2': 0xc8792d, '3': 0x8f4f1a, b: 0xf0e8d8, off: 0x3a2a1c },
}

// The game's HUD in one picture: armor over hearts on the left, food on the
// right, and the experience bar under both with the level at its start.
// `health` is in half hearts (0 to 20); `armor` and `food` count whole icons
// (0 to 10) and are left out when undefined.
export function hudPicture(state: { health: number; isHurt: boolean; armor?: number; food?: number; level: number; into: number; cost: number }): Picture {
  const width = state.food === undefined ? 39 : 81
  const pixels: (number | undefined)[][] = []
  const blank = () => new Array<number | undefined>(width).fill(undefined)
  const draw = (rows: (number | undefined)[][], art: string[], x: number, tint: Record<string, number>, lit: 'full' | 'half' | 'off') => {
    art.forEach((line, y) => {
      ;[...line].forEach((letter, column) => {
        if (letter === '.') return
        const isLit = lit === 'full' || (lit === 'half' && column === 0)
        rows[y]![x + column] = isLit ? tint[letter] : tint.off
      })
    })
  }
  if (state.armor !== undefined) {
    const rows = [blank()]
    for (let i = 0; i < 10; i++) draw(rows, PLATE, i * 4, TINTS.plate, i < state.armor ? 'full' : 'off')
    pixels.push(...rows, blank())
  }
  const rows = [blank(), blank()]
  for (let i = 0; i < 10; i++) {
    const left = state.health - i * 2
    draw(rows, HEART, i * 4, state.isHurt ? TINTS.hurt : TINTS.heart, left >= 2 ? 'full' : left === 1 ? 'half' : 'off')
  }
  // Food empties from the left, as the game's right-anchored bar does
  if (state.food !== undefined) {
    for (let i = 0; i < 10; i++) draw(rows, DRUMSTICK, 42 + i * 4, TINTS.food, i >= 10 - state.food ? 'full' : 'off')
  }
  pixels.push(...rows)
  // A thin bar, as the game's is; it starts after the level's label, which is stamped on its row
  const label = 'Lv ' + state.level + ' '
  const span = width - label.length
  const filled = state.cost <= 0 ? 0 : Math.max(0, Math.min(span, Math.round((state.into / state.cost) * span)))
  const top = blank()
  const bottom = blank()
  for (let x = 0; x < span; x++) {
    const isNotch = x % 8 === 7
    bottom[label.length + x] = x < filled ? (isNotch ? 0x4fa010 : 0x80ff20) : isNotch ? 0x1c1c1c : 0x3a3a3a
  }
  pixels.push(top, bottom)
  return paint(pixels, [{ text: label, row: pixels.length / 2 - 1, column: 0, color: 0x80ff20, back: CLEAR }])
}

// The title as the game opens on it: stone letters lit from above, standing
// on a strip of grass and dirt
export function titleScene(word: string): Picture {
  const width = word.length * 4 + 1
  const stone = [0xf2f2f2, 0xd0d0d0, 0xb0b0b0, 0x8e8e8e, 0x6c6c6c]
  const pixels: (number | undefined)[][] = []
  for (let row = 0; row < 5; row++) {
    const line: (number | undefined)[] = new Array(width).fill(undefined)
    ;[...word].forEach((letter, index) => {
      const glyph = FONT[letter]
      for (let column = 0; column < 3; column++) {
        if (glyph?.[row]?.[column] === '1') line[1 + index * 4 + column] = stone[row]
      }
    })
    pixels.push(line)
  }
  pixels.push(new Array(width).fill(undefined))
  const ground = [
    [0x7cbd4f, 0x6aa83f],
    [0x5e9a36, 0x6aa83f],
    [0x8a5a36, 0x6e4527],
    [0x7a4e2e, 0x8a5a36],
  ]
  for (const [main, speck] of ground) {
    pixels.push(Array.from({ length: width }, (_, x) => ((x * 7 + pixels.length * 13) % 5 === 0 ? speck : main)))
  }
  return paint(pixels)
}

// The ground each tab's tree is drawn on: stone, netherrack, end stone, grass
// and farmland, kept dark so the icons stand out. tools/sprites.py fills the
// corners of each icon with the same color
export const TAB_GROUND: Record<Tab, number> = {
  Story: 0x2e2e32,
  Nether: 0x341416,
  'The End': 0x32301e,
  Adventure: 0x1e3020,
  Husbandry: 0x33261a,
}

// Breaks text into lines of at most `width` cells, at spaces
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

// One piece of a row of the tree: a stretch of ground and lines, or the icon
// of an advancement
export type TreePiece = { picture: Picture } | { id: string }

export type Tree = { columns: number; order: string[]; bands: TreePiece[][] }

const NODE_COLUMNS = 4
const NODE_PITCH = 8
const ROW_PITCH = 3
const EDGE = 2

function shade(color: number, by: number): number {
  const part = (shift: number) => Math.max(0, Math.min(255, ((color >> shift) & 255) + by)) << shift
  return part(16) | part(8) | part(0)
}

// Lays a tab's advancements out as the game does: each one to the right of
// the one it comes after, siblings stacked, lines joining them. Trees with
// separate roots sit side by side while they fit in `maxColumns`, else in one
// stack; undefined when even that is too wide. The selected one gets white
// brackets. `order` is the walk the next and previous keys follow
export function advancementTree(
  tab: Tab,
  visible: Advancement[],
  earned: ReadonlySet<string>,
  selected: string,
  maxColumns: number,
): Tree | undefined {
  const mine = visible.filter(one => one.tab === tab)
  const ids = new Set(mine.map(one => one.id))
  const roots = mine.filter(one => !one.after || !ids.has(one.after))
  const childrenOf = (id: string) => mine.filter(one => one.after === id)

  // Each root's tree as a block of its own, in node columns and node rows
  type Placed = { id: string; x: number; y: number; parent?: Placed }
  const blocks = roots.map(root => {
    const nodes: Placed[] = []
    const place = (one: Advancement, x: number, top: number, parent?: Placed): number => {
      const node: Placed = { id: one.id, x, y: top, parent }
      nodes.push(node)
      let height = 0
      for (const child of childrenOf(one.id)) height += place(child, x + 1, top + height, node)
      return Math.max(1, height)
    }
    const height = place(root, 0, 0)
    return { nodes, height, width: Math.max(...nodes.map(node => node.x)) + 1 }
  })
  if (blocks.length === 0) return undefined

  const pack = (limit: number) => {
    const placed: Placed[] = []
    let left = 0
    let top = 0
    let wide = 0
    let rows = 0
    for (const block of blocks) {
      if (top > 0 && top + block.height > limit) {
        left += wide
        top = 0
        wide = 0
      }
      for (const node of block.nodes) {
        node.x += left
        node.y += top
        placed.push(node)
      }
      top += block.height
      wide = Math.max(wide, block.width)
      rows = Math.max(rows, top)
    }
    return { placed, rows, columns: (left + wide) * NODE_PITCH - (NODE_PITCH - NODE_COLUMNS) + EDGE * 2 }
  }
  // Remember where each node sits inside its block, to pack twice
  const home = new Map(blocks.flatMap(block => block.nodes.map(node => [node, { x: node.x, y: node.y }] as const)))
  let packed = pack(Math.max(4, ...blocks.map(block => block.height)))
  if (packed.columns > maxColumns) {
    for (const [node, at] of home) Object.assign(node, at)
    packed = pack(Infinity)
  }
  if (packed.columns > maxColumns) return undefined

  // The ground, then the lines, then the outline of the selected one
  // The ground runs the width of the screen, as the game's window does
  const { placed } = packed
  const columns = Math.max(packed.columns, Math.min(maxColumns, 120))
  const rows = 1 + packed.rows * ROW_PITCH
  const ground = TAB_GROUND[tab]
  const pixels: number[][] = Array.from({ length: rows * 2 }, (_, y) =>
    Array.from({ length: columns }, (_, x) => {
      const speck = ((x * 73856093) ^ (y * 19349663)) >>> 0
      return speck % 9 === 0 ? shade(ground, 10) : speck % 7 === 0 ? shade(ground, -8) : ground
    }),
  )
  const fill = (x0: number, x1: number, y0: number, y1: number, color: number) => {
    for (let y = Math.max(0, y0); y <= y1 && y < pixels.length; y++) {
      for (let x = Math.max(0, x0); x <= x1 && x < columns; x++) pixels[y]![x] = color
    }
  }
  const leftOf = (node: Placed) => EDGE + node.x * NODE_PITCH
  const topOf = (node: Placed) => (1 + node.y * ROW_PITCH) * 2
  const joined = placed.filter(node => node.parent)
  // Lit lines go on last, so a shared trunk shows the earned path
  for (const isLit of [false, true]) {
    for (const node of joined) {
      if (earned.has(node.id) !== isLit) continue
      const color = isLit ? 0xffffff : 0x6f6f6f
      const from = leftOf(node.parent!) + NODE_COLUMNS
      const out = topOf(node.parent!) + 1
      const into = topOf(node) + 1
      fill(from, from + 2, out, out + 1, color)
      fill(from + 1, from + 2, out, into + 1, color)
      fill(from + 1, from + 3, into, into + 1, color)
    }
  }
  const picked = placed.find(node => node.id === selected)
  if (picked) {
    const x = leftOf(picked)
    const y = topOf(picked)
    // A bracket at each corner, clear of where the lines meet the icon
    const right = x + NODE_COLUMNS
    for (const [edge, inner] of [
      [y - 1, y],
      [y + 4, y + 3],
    ] as const) {
      fill(x - 1, x, edge, edge, 0xffffff)
      fill(right - 1, right, edge, edge, 0xffffff)
      fill(x - 1, x - 1, Math.min(edge, inner), Math.max(edge, inner), 0xffffff)
      fill(right, right, Math.min(edge, inner), Math.max(edge, inner), 0xffffff)
    }
  }

  // Cut into rows of pieces: icons where the nodes are, ground between
  const cut = (x0: number, x1: number, row: number, tall: number): TreePiece => ({
    picture: paint(pixels.slice(row * 2, (row + tall) * 2).map(line => line.slice(x0, x1))),
  })
  const bands: TreePiece[][] = [[cut(0, columns, 0, 1)]]
  for (let y = 0; y < packed.rows; y++) {
    const row = 1 + y * ROW_PITCH
    const band: TreePiece[] = []
    let at = 0
    for (const node of placed.filter(one => one.y === y).sort((a, b) => a.x - b.x)) {
      band.push(cut(at, leftOf(node), row, 2), { id: node.id })
      at = leftOf(node) + NODE_COLUMNS
    }
    band.push(cut(at, columns, row, 2))
    bands.push(band, [cut(0, columns, row + 2, 1)])
  }
  return { columns, order: placed.map(node => node.id), bands }
}

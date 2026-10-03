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

export type Tab = 'Minecraft' | 'Nether' | 'The End' | 'Adventure' | 'Husbandry'

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
  stoneAge: { id: "stoneAge", title: "Stone Age", how: "Edit a file", icon: "🧱", tab: "Minecraft", frame: "task" },
  upgrade: { id: "upgrade", title: "Getting an Upgrade", how: "Get a green test run", icon: "🔰", tab: "Minecraft", frame: "task", after: "stoneAge" },
  acquireHardware: { id: "acquireHardware", title: "Acquire Hardware", how: "Get a build to succeed", icon: "🔩", tab: "Minecraft", frame: "task", after: "upgrade" },
  suitUp: { id: "suitUp", title: "Suit Up", how: "Pass a linter or a type checker", icon: "🦺", tab: "Minecraft", frame: "task", after: "acquireHardware" },
  notToday: { id: "notToday", title: "Not Today, Thank You", how: "Clear a problem a linter or type checker caught", icon: "🧿", tab: "Minecraft", frame: "task", after: "suitUp" },
  furiousCocktail: { id: "furiousCocktail", title: "A Furious Cocktail", how: "Have tests, checks and the build all green since the last edit", icon: "🧪", tab: "Minecraft", frame: "challenge", after: "notToday", xp: 30 },
  howDidWe: { id: "howDidWe", title: "How Did We Get Here?", how: "In one session: every check green, a verified commit, a push, a pull request, a subagent, a web lookup and a skill or MCP call", icon: "🌀", tab: "Minecraft", frame: "challenge", after: "furiousCocktail", isHidden: true, xp: 100 },
  ironPick: { id: "ironPick", title: "Isn't It Iron Pick", how: "Make a git commit", icon: "🪓", tab: "Minecraft", frame: "task", after: "acquireHardware" },
  diamonds: { id: "diamonds", title: "Diamonds!", how: "Commit with the tests green and nothing edited since", icon: "💎", tab: "Minecraft", frame: "task", after: "ironPick" },
  coverMe: { id: "coverMe", title: "Cover Me with Diamonds", how: "Make 25 verified commits", icon: "👑", tab: "Minecraft", frame: "goal", after: "diamonds", xp: 15 },
  coverMeInDebris: { id: "coverMeInDebris", title: "Cover Me in Debris", how: "Make 250 verified commits", icon: "🌑", tab: "Minecraft", frame: "challenge", after: "coverMe", xp: 100 },
  enchanter: { id: "enchanter", title: "Enchanter", how: "Use a skill", icon: "📕", tab: "Minecraft", frame: "task", after: "diamonds" },
  hotStuff: { id: "hotStuff", title: "Hot Stuff", how: "Push your commits", icon: "🔥", tab: "Minecraft", frame: "task", after: "ironPick" },
  iceBucket: { id: "iceBucket", title: "Ice Bucket Challenge", how: "Resolve a merge conflict", icon: "🧊", tab: "Minecraft", frame: "task", after: "hotStuff" },
  eyeSpy: { id: "eyeSpy", title: "Eye Spy", how: "Start a new branch", icon: "👀", tab: "Minecraft", frame: "task", after: "iceBucket" },
  zombieDoctor: { id: "zombieDoctor", title: "Zombie Doctor", how: "Get a broken tool working again", icon: "💉", tab: "Minecraft", frame: "goal", after: "stoneAge", xp: 15 },
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

export const TABS: readonly Tab[] = ['Minecraft', 'Nether', 'The End', 'Adventure', 'Husbandry']

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

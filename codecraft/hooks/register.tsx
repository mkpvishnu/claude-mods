import type { EngineInterface, Register } from 'claude-code'
import {
  ADVANCEMENTS,
  COLOR,
  MILESTONES,
  SPLASHES,
  TABS,
  bar,
  commandName,
  dayOf,
  daysBetween,
  deathMessage,
  gameMode,
  halves,
  isBuildCommand,
  isCheckCommand,
  isDocFile,
  isTargetedTest,
  isTestCommand,
  isTestFile,
  languageOf,
  levelOf,
  logoRows,
  pastWord,
  pick,
  spinnerWord,
  streakEnding,
  toolGlyph,
  chatAction,
  HEAD_CLAUDE,
  HEAD_PLAYER,
  TAB_GROUND,
  advancementTree,
  titleScene,
  wrapText,
  slotPicture,
  hudPicture,
  itemOf,
  xpPicture,
  type Advancement,
} from './lore.ts'

// What is kept for good, across every session: the advancements earned, and
// the counters, sets and dates the long ones are earned from
type Life = {
  counts: Record<string, number>
  // Runs that a failure resets, so they are not merged between sessions
  streaks: Record<string, number>
  sets: Record<string, string[]>
  // The days worked in each repository, and the last day each was opened
  repoDays: Record<string, string[]>
  repoSeen: Record<string, string>
  firstDay: string
}
const earned = new Set<string>()
let life: Life = { counts: {}, streaks: {}, sets: {}, repoDays: {}, repoSeen: {}, firstDay: '' }
let isLifeDirty = false

// Everything else counts one session and is saved under the session's id, so
// a hot reload or a resume picks it up and a new session starts from zero
let sessionId = ''
let xp = 0
let calls = 0
let deaths = 0
// What last verified the work, a green test run or a commit, and the edits
// made since
let verified: '' | 'tests' | 'commit' = ''
let unverifiedEdits = 0
let editsSinceGreen = 0
let isRedSinceVerified = false
// Files edited this session, with their edit counts
const items = new Map<string, number>()
// The first prompt's row in the transcript: the title is drawn above it, so
// it scrolls away with the start of the conversation
let titleRow = ''
// The first prompt's text, kept until its turn ends: the row's id changes
// once the engine stores the message, and the title follows it
let titleText: string | undefined
// What this session has done, for How Did We Get Here?
const facts = new Set<string>()
// Which of tests, checks and build have passed since the last edit
const passed = new Set<string>()

// Not saved: these describe the moment
let today = ''
// The permission mode, as the last prompt or turn end reported it
let permissionMode = ''
let root = ''
let isClean = false
let isPushed = false
let contextPercent: number | undefined
let hungerPercent: number | undefined
let hasWarnedHealth = false
let hasWarnedHunger = false
let lastTestFailed = false
let hasFailedCheck = false
let hasConflict = false
let hasCompacted = false
let hasNewTest = false
// True in a repository last opened 90 or more days ago
let isRevived = false
// The test command that last failed with 20 or more failures
let raid = ''
const filesSinceTest = new Set<string>()
let turnAgents = 0
// True for a moment after a call fails, while the hearts flash
let isHurt = false
let isTicking = false
let splash = ''
// The name chat lines carry for the person at the prompt
let player = 'Steve'
const TITLE = titleScene('CODECRAFT')
// Where the sprite files are, once the terminal is known to show pictures
// (kitty and Ghostty do); empty elsewhere, and the cell-grid art is drawn
let sprites = ''
let shownTab = 0
// The advancement the screen's outline is on; '' picks the next one to earn
let pickedAdvancement = ''
// Tool calls running now, oldest first; the spinner names the newest
const active: { id: string; tool: string; label: string; startedAt: number; timeoutMs: number }[] = []
// Tools used this turn, in first-use order, with their counts
const hotbar = new Map<string, number>()
const deathById = new Map<string, string>()
// How many times in a row each call has failed, and the ones that broke
const failures = new Map<string, number>()
const broken = new Set<string>()

type Saved = {
  id: string
  // When it was last written, to drop the records of sessions long over
  at: number
  xp: number
  calls: number
  deaths: number
  verified: '' | 'tests' | 'commit'
  unverifiedEdits: number
  editsSinceGreen: number
  isRedSinceVerified: boolean
  items: [string, number][]
  facts: string[]
  passed: string[]
  titleRow?: string
}

// A failed write costs the saved progress, never the hook that asked for it
async function keep($: EngineInterface, key: string, value: unknown) {
  try {
    await $.store.set(key, value)
  } catch {
    $.ui.log('could not save ' + key, { to: 'debug' })
  }
}

function union(a: readonly string[] = [], b: readonly string[] = []): string[] {
  return [...new Set([...a, ...b])]
}

// Another session may have written since this one read: counters take the
// larger value and sets are joined, so neither session's progress is lost
function merged(mine: Life, theirs: Partial<Life> | undefined): Life {
  if (!theirs) return mine
  const out: Life = { ...mine, counts: { ...mine.counts }, sets: { ...mine.sets }, repoDays: { ...mine.repoDays }, repoSeen: { ...mine.repoSeen } }
  for (const [name, value] of Object.entries(theirs.counts ?? {})) out.counts[name] = Math.max(out.counts[name] ?? 0, value)
  for (const [name, values] of Object.entries(theirs.sets ?? {})) out.sets[name] = union(out.sets[name], values)
  for (const [name, values] of Object.entries(theirs.repoDays ?? {})) out.repoDays[name] = union(out.repoDays[name], values)
  for (const [name, day] of Object.entries(theirs.repoSeen ?? {})) {
    if (day > (out.repoSeen[name] ?? '')) out.repoSeen[name] = day
  }
  const firstDays = [mine.firstDay, theirs.firstDay ?? ''].filter(Boolean).sort()
  out.firstDay = firstDays[0] ?? ''
  return out
}

async function save($: EngineInterface) {
  const now = await clockNow($)
  const saved: Saved = {
    id: sessionId,
    at: now,
    xp,
    calls,
    deaths,
    verified,
    unverifiedEdits,
    editsSinceGreen,
    isRedSinceVerified,
    items: [...items],
    facts: [...facts],
    passed: [...passed],
    titleRow,
  }
  // Every session with the mod loaded shares one store, so each keeps its own
  // record under its id; ones untouched for a week are dropped
  let sessions: Record<string, Saved> = {}
  try {
    sessions = ((await $.store.get('sessions')) as Record<string, Saved> | undefined) ?? {}
  } catch {
    // Nothing stored yet
  }
  for (const [id, other] of Object.entries(sessions)) {
    if (now - (other.at ?? 0) > 7 * 86400000) delete sessions[id]
  }
  if (sessionId) sessions[sessionId] = saved
  await keep($, 'sessions', sessions)
  if (!isLifeDirty) return
  isLifeDirty = false
  try {
    life = merged(life, (await $.store.get('lifetime')) as Partial<Life> | undefined)
  } catch {
    // Nothing stored to merge with
  }
  await keep($, 'lifetime', life)
}

async function restore($: EngineInterface) {
  const stored = await $.store.get('advancements')
  if (Array.isArray(stored)) for (const id of stored) earned.add(String(id))
  const lifetime = (await $.store.get('lifetime')) as Partial<Life> | undefined
  life = merged(life, lifetime)
  life.streaks = { ...lifetime?.streaks, ...life.streaks }
  const id = await $.session.id()
  // A new session in the same process (/clear) starts from zero
  if (sessionId && id !== sessionId) {
    xp = 0
    calls = 0
    deaths = 0
    verified = ''
    unverifiedEdits = 0
    editsSinceGreen = 0
    isRedSinceVerified = false
    items.clear()
    facts.clear()
    passed.clear()
    titleRow = ''
  }
  sessionId = id
  const sessions = (await $.store.get('sessions')) as Record<string, Saved> | undefined
  const saved = sessions?.[sessionId]
  if (!saved) return
  xp = saved.xp
  calls = saved.calls
  deaths = saved.deaths
  verified = saved.verified ?? ''
  unverifiedEdits = saved.unverifiedEdits ?? 0
  editsSinceGreen = saved.editsSinceGreen ?? 0
  isRedSinceVerified = saved.isRedSinceVerified ?? false
  for (const [path, count] of saved.items) items.set(path, count)
  for (const fact of saved.facts ?? []) facts.add(fact)
  for (const kind of saved.passed ?? []) passed.add(kind)
  titleRow = saved.titleRow ?? ''
}

async function clockNow($: EngineInterface): Promise<number> {
  try {
    return await $.clock.now()
  } catch {
    return 0
  }
}

async function runGit($: EngineInterface, args: string[]) {
  try {
    const run = await $.process.run(['git', ...args])
    return { ok: run.exitCode === 0, out: run.stdout.trim() }
  } catch {
    return { ok: false, out: '' }
  }
}

// The two safety nets git holds: nothing uncommitted, and nothing unpushed
async function refreshArmor($: EngineInterface) {
  if (!root) return
  const status = await runGit($, ['status', '--porcelain'])
  const ahead = await runGit($, ['rev-list', '--count', '@{upstream}..HEAD'])
  isClean = status.ok && status.out === ''
  isPushed = ahead.ok && ahead.out === '0'
  $.ui.invalidate('ui.render')
}

// Armor is what would save the work from a bad edit, out of 10: green tests
// over every edit (4), everything committed (3), everything pushed (3).
// Outside a git repository there is no armor row
function armor(): { points: number; parts: string } | undefined {
  if (!root) return undefined
  const isTested = editsSinceGreen === 0
  const points = (isTested ? 4 : 0) + (isClean ? 3 : 0) + (isPushed ? 3 : 0)
  const mark = (isOn: boolean, name: string) => (isOn ? '✓ ' : '✗ ') + name
  return { points, parts: [mark(isTested, 'tests green'), mark(isClean, 'committed'), mark(isPushed, 'pushed')].join(', ') }
}

function gain($: EngineInterface, amount: number) {
  const before = levelOf(xp).level
  xp += amount
  const after = levelOf(xp).level
  if (after > before) $.ui.toast('Level up! You are now level ' + after)
}

async function grant($: EngineInterface, advancement: Advancement) {
  if (earned.has(advancement.id)) return
  earned.add(advancement.id)
  // The game's three toasts, by frame
  const made = advancement.frame === 'challenge' ? 'Challenge Complete!' : advancement.frame === 'goal' ? 'Goal Reached!' : 'Advancement Made!'
  $.ui.toast(made + '  ' + advancement.icon + ' ' + advancement.title, { timeoutMs: 6000 })
  // The line the game writes in chat for each frame
  const did = advancement.frame === 'challenge' ? ' has completed the challenge [' : advancement.frame === 'goal' ? ' has reached the goal [' : ' has made the advancement ['
  $.ui.log(player + did + advancement.title + ']' + (advancement.xp ? ' +' + advancement.xp + ' XP' : ''))
  if (advancement.xp) gain($, advancement.xp)
  let stored: unknown
  try {
    stored = await $.store.get('advancements')
  } catch {
    // Nothing stored to join with
  }
  if (Array.isArray(stored)) for (const id of stored) earned.add(String(id))
  await keep($, 'advancements', [...earned])
}

// Adds to a lifetime counter and grants what its new total earns
async function tally($: EngineInterface, name: string) {
  const total = (life.counts[name] ?? 0) + 1
  life.counts[name] = total
  isLifeDirty = true
  for (const [threshold, advancement] of MILESTONES[name] ?? []) {
    if (total >= threshold) await grant($, advancement)
  }
}

// Adds to a lifetime set and returns its size
function collect(name: string, value: string): number {
  const values = life.sets[name] ?? (life.sets[name] = [])
  if (!values.includes(value)) {
    values.push(value)
    isLifeDirty = true
  }
  return values.length
}

// A day counts as worked once it has a commit or a green run over new edits
async function activeDay($: EngineInterface) {
  if (!today) return
  const days = collect('days', today)
  if (root) {
    const inRepo = life.repoDays[root] ?? (life.repoDays[root] = [])
    if (!inRepo.includes(today)) inRepo.push(today)
    isLifeDirty = true
    if (inRepo.length >= 7) await grant($, ADVANCEMENTS.bestFriendsForever)
    if (collect('repos', root) >= 10) await grant($, ADVANCEMENTS.adventuringTime)
  }
  const streak = streakEnding(life.sets.days ?? [], today)
  if (streak >= 7) await grant($, ADVANCEMENTS.homesteader)
  if (streak >= 30) await grant($, ADVANCEMENTS.oldGrowth)
  if (days >= 100) await grant($, ADVANCEMENTS.passingTheTime)
  if (life.firstDay && today.slice(5) === life.firstDay.slice(5) && today.slice(0, 4) > life.firstDay.slice(0, 4)) {
    await grant($, ADVANCEMENTS.birthdaySong)
  }
}

function setVerified(kind: 'tests' | 'commit') {
  verified = kind
  unverifiedEdits = 0
  isRedSinceVerified = false
}

function verifiedLine(): string {
  if (unverifiedEdits > 0) return '◇ ' + unverifiedEdits + (unverifiedEdits === 1 ? ' unverified edit' : ' unverified edits')
  if (!verified) return ''
  return '◆ verified (' + (verified === 'tests' ? 'green tests' : 'a commit') + ')'
}

// Hidden advancements are left out until they are earned, as in the game
function shown(): Advancement[] {
  return (Object.values(ADVANCEMENTS) as Advancement[]).filter(one => !one.isHidden || earned.has(one.id))
}

function advancementLines(): string[] {
  const all = Object.values(ADVANCEMENTS) as Advancement[]
  const lines = ['**Advancements** ' + earned.size + '/' + all.length]
  for (const tab of TABS) {
    lines.push('', '**' + tab + '**')
    for (const advancement of shown().filter(one => one.tab === tab)) {
      lines.push('- ' + (earned.has(advancement.id) ? '☑ ' : '☐ ') + advancement.icon + ' ' + advancement.title + ': ' + advancement.how)
    }
  }
  return lines
}

function inventory(): string {
  const { level, into, cost } = levelOf(xp)
  const all = Object.values(ADVANCEMENTS) as Advancement[]
  const titles = all.filter(one => earned.has(one.id)).map(one => one.title)
  const lines = [
    '**Level ' + level + '** (' + into + '/' + cost + ' XP to the next) · ' + calls + ' tool calls · ' + deaths + ' deaths',
  ]
  if (verifiedLine()) lines.push(verifiedLine())
  const worn = armor()
  if (worn) lines.push('Armor ' + worn.points + '/10: ' + worn.parts)
  lines.push('', '**Items** (files edited this session)')
  if (items.size === 0) lines.push('- Your inventory is empty')
  for (const [path, edits] of items) lines.push('- ' + path + ' ×' + edits)
  lines.push('', '**Advancements** ' + titles.length + '/' + all.length + (titles.length > 0 ? ': ' + titles.join(', ') : ''))
  lines.push('/advancements opens the screen')
  return lines.join('\n')
}

// The message recorded when the call failed, or one worked out from the row
// itself for a call that failed before the mod loaded
function deathOf(id: string, tool: string, input: unknown, output: unknown): string {
  const known = deathById.get(id)
  if (known) return known
  const command = (input as { command?: unknown } | undefined)?.command
  const subject = tool === 'Bash' && typeof command === 'string' ? commandName(command) : ''
  return deathMessage(tool, subject, typeof output === 'string' ? output : '', id)
}

function resultText(outcome: { text?: unknown; result?: unknown }): string {
  if (typeof outcome.text === 'string') return outcome.text
  if (typeof outcome.result === 'string') return outcome.result
  try {
    return JSON.stringify(outcome.result) ?? ''
  } catch {
    return ''
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A start with nobody at the prompt, once the person's session is known,
    // is a loop of its own (a subagent): it is not the session being counted
    if (sessionId && !e.isInteractive) return next(e)
    await restore($)
    const usage = await $.session.usage()
    contextPercent = usage.context.percent
    hungerPercent = usage.rateLimits.find(limit => limit.kind === 'five_hour')?.percentUsed
    const now = await clockNow($)
    splash = pick(SPLASHES, sessionId)
    player = (await $.env.get('USER')) || player
    const terminal = ((await $.env.get('TERM_PROGRAM')) ?? '') + ' ' + ((await $.env.get('TERM')) ?? '')
    const hasPictures = /ghostty|kitty/i.test(terminal) || Boolean(await $.env.get('KITTY_WINDOW_ID'))
    sprites = hasPictures && (await $.session.surface()) === 'terminal' ? $.plugin.root + '/assets/' : ''
    today = dayOf(now)
    if (!life.firstDay) {
      life.firstDay = today
      isLifeDirty = true
    }

    const top = await runGit($, ['rev-parse', '--show-toplevel'])
    root = top.ok ? top.out : ''
    if (root) {
      const seen = life.repoSeen[root]
      if (seen && seen < today) {
        await grant($, ADVANCEMENTS.sweetDreams)
        isRevived = daysBetween(seen, today) >= 90
      }
      life.repoSeen[root] = today
      isLifeDirty = true
      await refreshArmor($)
    }

    await $.command.register({
      name: 'inventory',
      description: 'Show your level, armor, the files you edited, and your advancements',
      immediate: true,
    })
    await $.command.register({
      name: 'advancements',
      description: 'Open the advancements screen',
      immediate: true,
    })
    // The status line script takes over the line in sessions where this mod
    // is loaded: the user's own script hands over when it sees the variable
    await $.env.set('CODECRAFT_STATUSLINE', $.plugin.root + '/scripts/statusline.sh')
    await save($)
    // The band may have drawn before the figures above arrived
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('command.run', { command: 'inventory' }, async () => {
    return { text: inventory() }
  })

  on('command.run', { command: 'advancements' }, async $ => {
    const surface = await $.session.surface()
    if (surface === 'terminal' || surface === 'desktop') {
      const opened = await $.ui.open({ id: 'advancements', title: 'Advancements', closeOnEscape: true, rows: 30 })
      if (opened.isPlaced) return {}
    }
    return { text: advancementLines().join('\n') }
  })

  on('turn.start', async ($, e, next) => {
    turnAgents = 0
    hotbar.clear()
    const now = await clockNow($)
    if (now) today = dayOf(now)
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    titleText = undefined
    await refreshArmor($)
    await save($)
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    hasCompacted = true
    return result
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id ?? ''
    const command = e.tool === 'Bash' ? e.command : ''
    const input = e as { description?: unknown; timeout?: unknown }
    calls += 1
    hotbar.set(e.tool, (hotbar.get(e.tool) ?? 0) + 1)
    active.push({
      id,
      tool: e.tool,
      label: e.tool === 'Agent' && typeof input.description === 'string' ? input.description : command,
      startedAt: await clockNow($),
      timeoutMs: typeof input.timeout === 'number' ? input.timeout : 120000,
    })
    // A running command redraws the band each second, for its boss bar
    if (e.tool === 'Bash' && !isTicking) {
      isTicking = true
      const tick = () => {
        if (!active.some(call => call.tool === 'Bash')) {
          isTicking = false
          return
        }
        $.ui.invalidate('ui.render')
        $.clock.after(1000, tick)
      }
      try {
        $.clock.after(1000, tick)
      } catch {
        isTicking = false
      }
    }
    $.ui.invalidate('ui.render')

    let outcome
    try {
      outcome = await next(e)
    } finally {
      const at = active.findIndex(call => call.id === id)
      if (at !== -1) active.splice(at, 1)
      $.ui.invalidate('ui.render')
    }

    const isEdit = e.tool === 'Edit' || e.tool === 'Write' || e.tool === 'NotebookEdit'
    const path = e.tool === 'NotebookEdit' ? e.notebook_path : e.tool === 'Edit' || e.tool === 'Write' ? e.file_path : ''
    const isTest = isTestCommand(command)
    const isCheck = !isTest && isCheckCommand(command)
    // What "the same call" means for durability: the tool and what it ran on
    const key = e.tool + ':' + (command || path)

    if (outcome.deny !== undefined || outcome.isError) {
      const text = outcome.deny ?? outcome.text ?? ''
      deaths += 1
      deathById.set(id, deathMessage(e.tool, commandName(command), text, id))
      if (isTest) {
        lastTestFailed = true
        isRedSinceVerified = true
        if (unverifiedEdits > 0) life.streaks.firstTry = 0
        const failed = /(\d+) failed/.exec(text)
        if (failed && Number(failed[1]) >= 20) raid = command
      }
      if (isCheck) hasFailedCheck = true
      if (/CONFLICT/.test(text)) hasConflict = true
      // A refusal or an interrupt is the person's doing, not a failed call
      if (outcome.deny === undefined && !/interrupt/i.test(text)) life.streaks.cleanCalls = 0
      const failed = (failures.get(key) ?? 0) + 1
      failures.set(key, failed)
      if (failed % 3 === 0) {
        broken.add(key)
        const what = command ? '`' + command.slice(0, 60) + '`' : e.tool + ' on ' + path
        $.ui.toast('Your tool broke! ' + failed + ' failures in a row', { timeoutMs: 8000 })
        $.ui.log('Your tool broke: ' + what + ' has failed ' + failed + ' times in a row. Time to try another way.')
      }
      isHurt = true
      try {
        $.clock.after(700, () => {
          isHurt = false
          $.ui.invalidate('ui.render')
        })
      } catch {
        isHurt = false
      }
      return outcome
    }

    const text = resultText(outcome)
    failures.delete(key)
    if (broken.delete(key)) await grant($, ADVANCEMENTS.zombieDoctor)
    life.streaks.cleanCalls = (life.streaks.cleanCalls ?? 0) + 1
    if (life.streaks.cleanCalls >= 100) await grant($, ADVANCEMENTS.sneak100)

    if (isEdit) {
      items.set(path, (items.get(path) ?? 0) + 1)
      unverifiedEdits += 1
      editsSinceGreen += 1
      passed.clear()
      filesSinceTest.add(path)
      await grant($, ADVANCEMENTS.stoneAge)
      const language = languageOf(path)
      if (language && collect('languages', language) >= 8) await grant($, ADVANCEMENTS.aBalancedDiet)
      if (e.tool === 'Write' && isTestFile(path)) hasNewTest = true
      if (isDocFile(path)) await grant($, ADVANCEMENTS.glowAndBehold)
      if (/(^|\/)(CLAUDE|AGENTS)\.md$/.test(path)) await grant($, ADVANCEMENTS.countryLode)
      if (/\.claude\/(agents|skills|commands|hooks)\/|(^|\/)SKILL\.md$/.test(path)) await grant($, ADVANCEMENTS.craftersCrafting)
    }
    if (e.tool === 'Agent') {
      facts.add('agent')
      turnAgents += 1
      await grant($, ADVANCEMENTS.deeper)
      if (turnAgents >= 3) await grant($, ADVANCEMENTS.subspaceBubble)
      await tally($, 'subagents')
    }
    if (e.tool === 'WebSearch' || e.tool === 'WebFetch') {
      facts.add('web')
      await grant($, ADVANCEMENTS.isItABird)
    }
    if (e.tool === 'Skill') {
      facts.add('outside')
      await grant($, ADVANCEMENTS.enchanter)
    }
    if (e.tool.startsWith('mcp__')) {
      facts.add('outside')
      await grant($, ADVANCEMENTS.underLockAndKey)
      if (collect('mcpServers', e.tool.split('__')[1] ?? '') >= 5) await grant($, ADVANCEMENTS.revaulting)
    }

    // Experience comes from verified progress alone: a commit, a pull
    // request, or a green test run that covers new edits or follows a red one
    const gitOperation = (outcome.result as { gitOperation?: { commit?: unknown; pr?: { action?: string } } } | undefined)
      ?.gitOperation
    if (/CONFLICT/.test(text)) hasConflict = true
    // A quiet commit prints nothing for the engine to recognise, so the
    // command itself counts too
    const isCommit = Boolean(gitOperation?.commit) || /\bgit\b[^|;&]*\bcommit\b/.test(command)
    if (isCommit) {
      await grant($, ADVANCEMENTS.ironPick)
      gain($, 7)
      if (verified === 'tests' && unverifiedEdits === 0) {
        facts.add('commit')
        await grant($, ADVANCEMENTS.diamonds)
        await tally($, 'verifiedCommits')
        if ((contextPercent ?? 0) >= 95) await grant($, ADVANCEMENTS.stickySituation)
      }
      setVerified('commit')
      await activeDay($)
    }
    if (hasConflict && (isCommit || /\bgit (rebase|merge|cherry-pick) --continue\b/.test(command))) {
      hasConflict = false
      await grant($, ADVANCEMENTS.iceBucket)
    }
    if (gitOperation?.pr?.action === 'created' || /\bgh pr create\b/.test(command)) {
      facts.add('pr')
      await grant($, ADVANCEMENTS.theEnd)
      gain($, 10)
      await tally($, 'prs')
      if (root && collect('prRepos', root) >= 3) await grant($, ADVANCEMENTS.remoteGetaway)
    }
    if (command) {
      if (/\bgit push\b/.test(command)) {
        facts.add('push')
        await grant($, ADVANCEMENTS.hotStuff)
      }
      if (/\bgh pr merge\b/.test(command)) {
        await grant($, ADVANCEMENTS.freeTheEnd)
        await tally($, 'merges')
      }
      if (/\b(gh release create|git push\b.*(--tags|\bv\d)|npm publish|cargo publish|twine upload)/.test(command)) {
        await grant($, ADVANCEMENTS.cityAtTheEnd)
      }
      if (/\bgit (checkout -b|switch -c|worktree add\b.* -b)\b/.test(command)) await grant($, ADVANCEMENTS.eyeSpy)
      if (/\bgit (blame|show|log\b.*( -S| -L|--follow))/.test(command)) await grant($, ADVANCEMENTS.thoseWereTheDays)
      if (/is the first bad commit/.test(text)) await grant($, ADVANCEMENTS.hiddenInTheDepths)
      if (/\bgit revert\b/.test(command)) await grant($, ADVANCEMENTS.returnToSender)
      if (/\bgit rebase\b/.test(command) && !hasConflict) await grant($, ADVANCEMENTS.totalBeelocation)
      if (isBuildCommand(command)) {
        passed.add('build')
        await grant($, ADVANCEMENTS.acquireHardware)
      }
    }
    if (isCheck) {
      passed.add('check')
      await grant($, ADVANCEMENTS.suitUp)
      if (hasFailedCheck) await grant($, ADVANCEMENTS.notToday)
      hasFailedCheck = false
    }
    if (isTest) {
      passed.add('test')
      await grant($, ADVANCEMENTS.upgrade)
      if (isTargetedTest(command)) await grant($, ADVANCEMENTS.takeAim)
      const passing = /(\d+) passed/.exec(text)
      if (passing && Number(passing[1]) >= 500) await grant($, ADVANCEMENTS.overOverkill)
      if (lastTestFailed) {
        await grant($, ADVANCEMENTS.monsterHunter)
        gain($, 5)
        await tally($, 'redToGreen')
        if (raid === command) await grant($, ADVANCEMENTS.heroOfTheVillage)
      }
      if (unverifiedEdits > 0 || lastTestFailed) {
        gain($, 7)
        await tally($, 'greens')
        await activeDay($)
        if (unverifiedEdits > 0) {
          if (!isRedSinceVerified) {
            await grant($, ADVANCEMENTS.sniperDuel)
            life.streaks.firstTry = (life.streaks.firstTry ?? 0) + 1
            if (life.streaks.firstTry >= 10) await grant($, ADVANCEMENTS.bullseye)
            if (filesSinceTest.size >= 5) await grant($, ADVANCEMENTS.arbalistic)
          }
          if (hasCompacted) await grant($, ADVANCEMENTS.postmortal)
          if (hasNewTest) await grant($, ADVANCEMENTS.aSeedyPlace)
          if (isRevived) await grant($, ADVANCEMENTS.plantingThePast)
        }
      }
      lastTestFailed = false
      raid = ''
      hasNewTest = false
      editsSinceGreen = 0
      filesSinceTest.clear()
      setVerified('tests')
    }
    if (passed.size === 3) {
      facts.add('cocktail')
      await grant($, ADVANCEMENTS.furiousCocktail)
    }
    if (['cocktail', 'commit', 'push', 'pr', 'agent', 'web', 'outside'].every(fact => facts.has(fact))) {
      await grant($, ADVANCEMENTS.howDidWe)
    }
    isLifeDirty = true
    // What the call did to the working tree shows on the armor row
    if (isEdit || command) await refreshArmor($)
    return outcome
  })

  on('session.measure', async ($, e, next) => {
    contextPercent = e.context.percent
    const limit = e.rateLimits.find(one => one.kind === 'five_hour')
    hungerPercent = limit?.percentUsed

    const used = contextPercent ?? 0
    if (used >= 90) await grant($, ADVANCEMENTS.cavesAndCliffs)
    if (used >= 80 && !hasWarnedHealth) {
      hasWarnedHealth = true
      $.ui.toast('Low health: ' + halves(100 - used) / 2 + ' hearts of context left. /compact to rest.', { timeoutMs: 8000 })
    }
    if (used < 60) hasWarnedHealth = false

    const eaten = hungerPercent ?? 0
    if (eaten >= 80 && !hasWarnedHunger) {
      hasWarnedHunger = true
      const resets = limit?.resetsAt ? ' It refills at ' + limit.resetsAt.slice(11, 16) + ' UTC.' : ''
      $.ui.toast('You are starving: ' + eaten + '% of the five-hour limit is used.' + resets, { timeoutMs: 8000 })
    }
    if (eaten < 50) hasWarnedHunger = false

    $.ui.invalidate('ui.render')
    return next(e)
  })

  // The spinner names what the newest running tool is doing
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.props.message !== null) return next(e)
    const tool = active[active.length - 1]?.tool
    return next({ ...e, props: { ...e.props, word: spinnerWord(tool, e.props.mode, e.props.word) } })
  })

  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    return next({ ...e, props: { ...e.props, word: pastWord(e.props.word) } })
  })

  // The engine names the permission mode when a prompt is sent and when a
  // turn ends, so a switch with shift+tab shows from the next prompt on
  on('classic.SessionStart', async ($, e, next) => {
    permissionMode = e.permission_mode ?? permissionMode
    return next(e)
  })
  on('classic.UserPromptSubmit', async ($, e, next) => {
    permissionMode = e.permission_mode ?? permissionMode
    $.ui.invalidate('ui.render')
    return next(e)
  })
  on('classic.Stop', async ($, e, next) => {
    permissionMode = e.permission_mode ?? permissionMode
    $.ui.invalidate('ui.render')
    return next(e)
  })

  // The permission mode reads as the game mode it plays like, among the
  // footer's mode labels: plan mode can look and not touch, bypass has no net
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (!permissionMode) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const mode = gameMode(permissionMode)
    return (
      <Box flexDirection="row" gap={1}>
        <Text color={mode.color} bold>
          {mode.name}
        </Text>
        {await next(e)}
      </Box>
    )
  })

  // A call through a skill or an MCP server is borrowed power: the dot of
  // its row is drawn over with the enchantment glint
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    // The game reports an operator's command in chat as a gray italic
    // `[Name: what it did]`; a skill or MCP tool, being enchanted, carries the glint
    const { Box, Text } = $.ui.resolve(e)
    const isEnchanted = e.props.tool === 'Skill' || e.props.tool.startsWith('mcp__')
    const color = e.props.isErrored ? COLOR.red : e.props.isRunning ? COLOR.white : COLOR.gray
    const tail = e.props.isInterrupted ? ' (interrupted)' : e.props.isRunning ? '…' : ''
    return (
      <Box flexDirection="row" gap={1}>
        {isEnchanted ? <Text color={COLOR.purple}>✦</Text> : null}
        <Text color={color} italic wrap="truncate">
          {'[Claude: ' + chatAction(e.props.tool, e.props.input, root) + tail + ']'}
        </Text>
      </Box>
    )
  })

  // A reply is a chat line from Claude: the name opens the reply and the
  // blocks after it sit under its text
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const elements = $.ui.resolve(e)
    const { Box, Text, Markdown } = elements
    // Only the terminal has the cell grid the heads are painted on
    const Raster = 'Raster' in elements ? elements.Raster : undefined
    // A picture of the head where the terminal shows pictures, the cell-grid
    // one elsewhere
    const Picture = sprites && 'Image' in elements ? elements.Image : undefined
    if (!e.props.isFirstOfReply) {
      return (
        <Box paddingLeft={(Picture ? 4 : HEAD_CLAUDE.columns) + 1}>
          <Markdown text={e.props.text} />
        </Box>
      )
    }
    return (
      <Box flexDirection="row" gap={1} marginTop={1}>
        {Picture ? (
          <Picture source={{ file: sprites + 'head-claude.png', format: 'png' }} columns={4} rows={2} alt=" " />
        ) : Raster ? (
          <Raster key="head" {...HEAD_CLAUDE} />
        ) : null}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text color={COLOR.gold} bold>
            {'<Claude>'}
          </Text>
          <Markdown text={e.props.text} />
        </Box>
      </Box>
    )
  })

  // The title belongs to the start of the conversation: it sits over the
  // prompt until the first one is sent, then above that prompt's row
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.props.origin.kind === 'composer') {
      if (!titleRow) {
        titleRow = e.requestId
        titleText = e.props.text
        $.ui.invalidate('ui.render')
      } else if (titleText === e.props.text) {
        titleRow = e.requestId
      }
    }
    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    const Raster = 'Raster' in elements ? elements.Raster : undefined
    // The person's own prompt is a chat line under their name, beside their
    // head; a row from anyone else keeps the engine's drawing
    const row =
      e.props.origin.kind === 'composer' ? (
        <Box flexDirection="row" gap={1} marginTop={1}>
          {sprites && 'Image' in elements ? (
            <elements.Image source={{ file: sprites + 'head-player.png', format: 'png' }} columns={4} rows={2} alt=" " />
          ) : Raster ? (
            <Raster key="head" {...HEAD_PLAYER} />
          ) : null}
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            <Text color={COLOR.aqua} bold>
              {'<' + player + '>'}
            </Text>
            <Text color={COLOR.white}>{e.props.text}</Text>
          </Box>
        </Box>
      ) : (
        await next(e)
      )
    if (e.requestId !== titleRow) return row
    const logo = logoRows('CODECRAFT')
    return (
      <Box flexDirection="column">
        {Raster ? (
          <Raster key="title" {...TITLE} />
        ) : (
          <Box flexDirection="column">
            <Text color={COLOR.white}>{logo[0]}</Text>
            <Text color={COLOR.stone}>{logo[1]}</Text>
            <Text color={COLOR.gray}>{logo[2]}</Text>
          </Box>
        )}
        <Text color={COLOR.yellow} bold italic>
          {splash}
        </Text>
        <Text color={COLOR.yellow}>{player + ' joined the game'}</Text>
        {row}
      </Box>
    )
  })

  // A failed call gets a death message above the engine's own error text
  on('ui.render', { component: 'ToolResult', props: { isErrored: true } }, async ($, e, next) => {
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={COLOR.red}>☠ {deathOf(e.props.tool_use_id, e.props.tool, undefined, e.props.output)}</Text>
        {await next(e)}
      </Box>
    )
  })

  // A folded run of calls is drawn as chat lines too, the last four of them,
  // with each death under its call; ctrl+o still unfolds the engine's rows
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const shown = e.props.calls.slice(-4)
    const earlier = e.props.calls.length - shown.length
    const lines = []
    if (earlier > 0) {
      lines.push(
        <Text color={COLOR.darkGray} italic>
          {'[Claude: ' + earlier + ' earlier ' + (earlier === 1 ? 'action' : 'actions') + ', ctrl+o to see]'}
        </Text>,
      )
    }
    for (const call of shown) {
      const isDead = call.isErrored && !call.isInterrupted
      lines.push(
        <Text color={call.isErrored ? COLOR.red : call.isRunning ? COLOR.white : COLOR.gray} italic wrap="truncate">
          {'[Claude: ' + chatAction(call.tool, call.input, root) + (call.isInterrupted ? ' (interrupted)' : call.isRunning ? '…' : '') + ']'}
        </Text>,
      )
      if (isDead) {
        lines.push(<Text color={COLOR.red}>  ☠ {deathOf(call.tool_use_id ?? '', call.tool, call.input, call.output)}</Text>)
      }
    }
    return <Box flexDirection="column">{lines}</Box>
  })

  // The advancements screen: the game's five tabs, one shown at a time. Where
  // the terminal shows images the tab is drawn as the game's tree: an icon for
  // each advancement in a gold frame once earned, a stone one while open and
  // a dark one while the advancement before it is not earned, lines joining
  // them, and under the tree what the outlined one asks for. The pointer over
  // an icon shows that one instead. Elsewhere each advancement is a card
  on('ui.render', { component: 'Pane', requestId: 'advancements' }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Text, Button } = elements
    const all = Object.values(ADVANCEMENTS) as Advancement[]
    const titles: Record<string, Advancement> = ADVANCEMENTS
    // 28 cells hold the longest title beside its icon, inside the frame
    const columns = Math.max(1, Math.min(3, Math.floor((e.props.bodyColumns + 1) / 29)))
    const cardWidth = Math.floor((e.props.bodyColumns - (columns - 1)) / columns)

    const total = bar(earned.size, all.length, 15)
    const rows = [
      <Box flexDirection="row" gap={1}>
        <Text color={COLOR.xp}>{total.filled}</Text>
        <Text color={COLOR.darkGray}>{total.empty}</Text>
        <Text color={COLOR.white} bold>
          {earned.size}/{all.length}
        </Text>
        <Text color={COLOR.gray}>advancements made</Text>
      </Box>,
    ]

    const tabs = TABS.map((tab, index) => {
      const done = all.filter(one => one.tab === tab && earned.has(one.id)).length
      const label = ' ' + tab + ' ' + done + ' '
      if (index === shownTab) {
        return (
          <Text color={COLOR.black} backgroundColor={COLOR.gold} bold>
            {label}
          </Text>
        )
      }
      return (
        <Button
          key={'tab-' + index}
          hotkey={String(index + 1)}
          plain
          onPress={() => {
            shownTab = index
            pickedAdvancement = ''
            $.ui.invalidate('ui.render')
          }}
        >
          {tab + ' ' + done}
        </Button>
      )
    })
    rows.push(
      <Box flexDirection="row" flexWrap="wrap" columnGap={1} marginTop={1}>
        {tabs}
      </Box>,
    )

    const tab = TABS[shownTab] ?? 'Story'
    const hidden = all.filter(one => one.tab === tab && one.isHidden && !earned.has(one.id)).length
    const isLocked = (one: Advancement) => !earned.has(one.id) && one.after !== undefined && !earned.has(one.after)
    if (sprites && 'Image' in elements && 'Raster' in elements) {
      const { Image, Raster } = elements
      const inTab = shown().filter(one => one.tab === tab)
      const picked =
        inTab.find(one => one.id === pickedAdvancement) ?? inTab.find(one => !earned.has(one.id) && !isLocked(one)) ?? inTab[0]
      const tree = advancementTree(tab, inTab, earned, picked?.id ?? '', e.props.bodyColumns)
      if (tree && picked) {
        // The whole screen sits on the tab's ground, so the text and the gap
        // around each icon read the same on a light theme as on a dark one
        const backdrop = '#' + TAB_GROUND[tab].toString(16).padStart(6, '0')
        const ground = tree.bands.map((band, row) => {
          return (
            <Box flexDirection="row">
              {band.map((piece, index) => {
                if ('picture' in piece) return <Raster key={'ground-' + row + '-' + index} {...piece.picture} />
                const one = titles[piece.id]!
                const state = earned.has(one.id) ? 'earned' : isLocked(one) ? 'locked' : 'open'
                return (
                  <Box key={'node-' + one.id} width={4} height={2} backgroundColor={backdrop} hover={{ scope: 'advancement-' + one.id }}>
                    <Image source={{ file: sprites + 'adv-' + one.id + '-' + state + '.png', format: 'png' }} columns={4} rows={2} alt={one.icon} />
                  </Box>
                )
              })}
            </Box>
          )
        })

        // What one advancement asks for, every line as wide as the body so a
        // card shown over another hides it. It sits over the tree, where it
        // stays in view while a tall tree scrolls
        const width = e.props.bodyColumns
        const lines = width >= 66 ? 2 : 3
        const card = (one: Advancement) => {
          const isEarned = earned.has(one.id)
          const parent = one.after ? titles[one.after] : undefined
          const lit = one.frame === 'challenge' ? COLOR.purple : COLOR.gold
          const kind = one.frame === 'task' ? '' : one.frame === 'goal' ? 'Goal' : 'Challenge'
          const state = isEarned ? '✔ Made' : isLocked(one) && parent ? 'After ' + parent.title : 'Open'
          const facts = [kind, one.xp ? '+' + one.xp + ' XP' : '', state].filter(Boolean).join(' · ')
          const how = wrapText(one.how, width).slice(0, lines)
          return [
            <Box flexDirection="row" width={width}>
              <Text color={isEarned ? lit : isLocked(one) ? COLOR.stone : COLOR.white} bold wrap="truncate">
                {one.title}
              </Text>
              <Text color={isEarned ? COLOR.green : COLOR.gray} wrap="truncate">
                {('  ' + facts).padEnd(Math.max(0, width - one.title.length))}
              </Text>
            </Box>,
            ...Array.from({ length: lines }, (_, line) => (
              <Text color={COLOR.gray} wrap="truncate">
                {(how[line] ?? '').padEnd(width)}
              </Text>
            )),
          ]
        }
        const step = (by: number) => () => {
          const at = tree.order.indexOf(picked.id)
          pickedAdvancement = tree.order[(at + by + tree.order.length) % tree.order.length] ?? ''
          $.ui.invalidate('ui.render')
        }
        return (
          <Box flexDirection="column" width={width} backgroundColor={backdrop}>
            <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
              {tabs}
            </Box>
            <Box flexDirection="column" height={lines + 1} marginTop={1}>
            {card(picked)}
            {tree.order
              .filter(id => id !== picked.id)
              .map(id => (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  flexDirection="column"
                  backgroundColor={backdrop}
                  display="none"
                  hover={{ scope: 'advancement-' + id, display: 'flex' }}
                >
                  {card(titles[id]!)}
                </Box>
              ))}
            </Box>
            <Box flexDirection="row" columnGap={1}>
              <Button key="previous" hotkey="p" plain onPress={step(-1)}>
                Previous
              </Button>
              <Button key="next" hotkey="n" plain onPress={step(1)}>
                Next
              </Button>
              <Text color={COLOR.gray} wrap="truncate">
                {'· ' + earned.size + '/' + all.length + ' made' + (hidden > 0 ? ' · ' + hidden + ' hidden in this tab' : '')}
              </Text>
            </Box>
            {ground}
          </Box>
        )
      }
    }

    const cards = []
    for (const advancement of shown().filter(one => one.tab === tab)) {
      const isEarned = earned.has(advancement.id)
      const parent = advancement.after ? titles[advancement.after] : undefined
      const lit = advancement.frame === 'challenge' ? COLOR.purple : COLOR.gold
      const frame = advancement.frame === 'challenge' ? 'double' : advancement.frame === 'goal' ? 'round' : 'single'
      cards.push(
        <Box flexDirection="column" width={cardWidth} borderStyle={frame} borderColor={isEarned ? lit : COLOR.darkGray}>
          <Text color={isEarned ? lit : isLocked(advancement) ? COLOR.darkGray : COLOR.stone} bold={isEarned} wrap="truncate">
            {isLocked(advancement) ? '🔒' : advancement.icon} {advancement.title}
          </Text>
          <Text color={isEarned ? COLOR.white : COLOR.darkGray}>
            {isLocked(advancement) && parent ? 'After ' + parent.title : advancement.how}
          </Text>
        </Box>,
      )
    }
    rows.push(
      <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
        {cards}
      </Box>,
    )
    if (hidden > 0) {
      rows.push(
        <Text color={COLOR.darkGray} italic>
          {hidden === 1 ? '1 hidden advancement' : hidden + ' hidden advancements'} in this tab
        </Text>,
      )
    }
    return <Box flexDirection="column">{rows}</Box>
  })

  // The HUD, laid out as the game's: armor over the hearts, hearts for the
  // context left on the left, drumsticks for the usage limit left on the
  // right, the XP bar under both, and while a turn runs the hotbar of tools
  // it has used, with a villager for each subagent that is out. Beside it sit
  // the two things to act on: a low-health warning and the unverified edits.
  // Until the first prompt the title sits above it; a long command's boss
  // bar takes that place while it runs
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const isWide = e.props.bodyColumns >= 44
    const hudWidth = isWide ? 36 : 20

    const used = contextPercent ?? 0
    const health = halves(100 - used)
    const hearts = []
    for (let i = 0; i < 10; i++) {
      const left = health - i * 2
      if (isHurt) hearts.push(<Text color={COLOR.white}>♥</Text>)
      else if (left >= 2) hearts.push(<Text color={COLOR.red}>♥</Text>)
      else if (left === 1) hearts.push(<Text color={COLOR.darkRed}>♥</Text>)
      else hearts.push(<Text color={COLOR.darkGray}>♡</Text>)
    }

    // Food empties from the left, as the game's right-anchored bar does
    const food = []
    if (hungerPercent !== undefined && isWide) {
      const full = Math.ceil(halves(100 - hungerPercent) / 2)
      for (let i = 0; i < 10; i++) {
        if (i < 10 - full) food.push(<Text color={COLOR.darkGray}>░░</Text>)
        else food.push(<Text>🍗</Text>)
      }
    }

    const worn = armor()
    const { level, into, cost } = levelOf(xp)
    const label = 'Lv ' + level
    const experience = bar(into, cost, hudWidth - label.length - 1)
    const verifiedText = verifiedLine()
    const verifiedColor = unverifiedEdits >= 5 ? COLOR.gold : unverifiedEdits === 0 ? COLOR.green : COLOR.gray

    // The hotbar: painted slots where the terminal has the cell grid and the
    // band has four rows left for them, a line of glyphs otherwise
    const elements = $.ui.resolve(e)
    // A command that has run five seconds is a boss: its bar drains toward
    // the command's timeout
    const now = await clockNow($)
    const boss = active.find(call => call.tool === 'Bash' && now - call.startedAt >= 5000)
    // Rows already spoken for: the boss bar, the HUD and the line under it
    const taken = (boss ? 2 : 0) + 3 + 1
    const Raster = 'Raster' in elements && e.props.maxRows - taken >= 4 ? elements.Raster : undefined
    const Sprite = sprites && 'Image' in elements && e.props.maxRows - taken >= 2 ? elements.Image : undefined
    const slots = []
    if (e.props.isWorking) {
      const running = active[active.length - 1]?.tool
      for (const [tool, uses] of [...hotbar].slice(-9)) {
        const isHeld = tool === running
        slots.push(
          Sprite ? (
            // The item in its slot, and the stack's count at its foot
            <Box flexDirection="row">
              <Sprite source={{ file: sprites + 'slot-' + itemOf(tool) + (isHeld ? '-held' : '') + '.png', format: 'png' }} columns={4} rows={2} alt={toolGlyph(tool)} />
              <Box flexDirection="column" justifyContent="flex-end">
                <Text color={isHeld ? COLOR.white : COLOR.gray} bold={isHeld}>
                  {String(uses)}
                </Text>
              </Box>
            </Box>
          ) : Raster ? (
            <Raster key={'slot-' + tool} {...slotPicture(tool, uses, isHeld)} />
          ) : (
            <Text color={isHeld ? COLOR.black : COLOR.stone} backgroundColor={isHeld ? COLOR.stone : COLOR.slot} bold={isHeld}>
              {' ' + toolGlyph(tool) + ' ' + uses + ' '}
            </Text>
          ),
        )
      }
      for (const call of active.filter(one => one.tool === 'Agent').slice(0, 4)) {
        slots.push(
          <Text color={COLOR.black} backgroundColor={COLOR.emerald} wrap="truncate">
            {' 👤 ' + (call.label.slice(0, 18) || 'villager') + ' '}
          </Text>,
        )
      }
    }

    const top = []
    if (boss) {
      const elapsed = now - boss.startedAt
      const left = bar(Math.max(0, boss.timeoutMs - elapsed), boss.timeoutMs, hudWidth)
      const seconds = Math.floor(elapsed / 1000)
      top.push(
        <Box flexDirection="row" gap={1} width={hudWidth} justifyContent="space-between">
          <Text color={COLOR.purple} bold wrap="truncate">
            {boss.label.split('\n')[0]?.slice(0, hudWidth - 7)}
          </Text>
          <Text color={COLOR.gray}>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </Text>
        </Box>,
      )
      top.push(
        <Box flexDirection="row">
          <Text color={COLOR.purple}>{left.filled}</Text>
          <Text color={COLOR.darkGray}>{left.empty}</Text>
        </Box>,
      )
    } else if (!titleRow && e.props.maxRows >= 10 && e.props.bodyColumns >= 48) {
      const Scene = 'Raster' in elements ? elements.Raster : undefined
      if (Scene) top.push(<Scene key="title" {...TITLE} />)
      top.push(
        <Text color={COLOR.yellow} bold italic>
          {splash}
        </Text>,
      )
    }

    // The painted HUD where the terminal has the cell grid and the band is
    // wide enough for it; the glyph one below otherwise
    const foodLeft = hungerPercent === undefined ? undefined : Math.ceil(halves(100 - hungerPercent) / 2)
    const picture = hudPicture({ health, isHurt, armor: worn?.points, food: foodLeft, level, into, cost })
    const Hud = 'Raster' in elements && e.props.bodyColumns >= picture.columns && e.props.maxRows >= picture.rows + 1 ? elements.Raster : undefined
    const notes = (
      <Box flexDirection="column">
        {worn ? <Text color={COLOR.darkGray}>{worn.points < 10 ? worn.parts : ' '}</Text> : null}
        <Text color={COLOR.gold}>{used >= 80 ? 'low health · /compact' : ' '}</Text>
        <Box flexDirection="row" gap={2}>
          {verifiedText ? <Text color={verifiedColor}>{verifiedText}</Text> : null}
          {deaths > 0 ? <Text color={COLOR.gray}>☠ {deaths}</Text> : null}
        </Box>
      </Box>
    )
    const Icon = sprites && 'Image' in elements && 'Raster' in elements && e.props.bodyColumns >= 42 ? elements.Image : undefined
    if (Icon && 'Raster' in elements) {
      // The game's own icons, two columns each: armor over hearts, food on
      // the right, the experience bar under both
      const Bar = elements.Raster
      // Each carries a glyph as its alt, drawn if the terminal turns out not
      // to show pictures after all
      const ALTS: Record<string, string> = { heart: '♥', 'heart-half': '♥', 'heart-hurt': '♥', 'heart-empty': '♡', armor: '⛨', 'armor-empty': '·', food: '◆', 'food-empty': '·' }
      const icon = (name: string) => <Icon source={{ file: sprites + name + '.png', format: 'png' }} columns={2} rows={1} alt={ALTS[name] ?? ' '} />
      const heartRow = []
      const plateRow = []
      const foodRow = []
      for (let i = 0; i < 10; i++) {
        const left = health - i * 2
        heartRow.push(icon(left <= 0 ? 'heart-empty' : isHurt ? 'heart-hurt' : left === 1 ? 'heart-half' : 'heart'))
        if (worn) plateRow.push(icon(i < worn.points ? 'armor' : 'armor-empty'))
        if (foodLeft !== undefined) foodRow.push(icon(i >= 10 - foodLeft ? 'food' : 'food-empty'))
      }
      const width = foodLeft === undefined ? 20 : 42
      const isBeside = e.props.bodyColumns >= width + 3 + 38
      const line = [worn && worn.points < 10 ? worn.parts : '', used >= 80 ? 'low health · /compact' : '', verifiedText ?? '', deaths > 0 ? '☠ ' + deaths : '']
        .filter(Boolean)
        .join('  ·  ')
      return (
        <Box flexDirection="column">
          {top}
          <Box flexDirection="row" gap={3}>
            <Box flexDirection="column" width={width}>
              {worn ? <Box flexDirection="row">{plateRow}</Box> : null}
              <Box flexDirection="row" justifyContent="space-between">
                <Box flexDirection="row">{heartRow}</Box>
                <Box flexDirection="row">{foodRow}</Box>
              </Box>
              <Bar key="xp" {...xpPicture(width, level, into, cost)} />
            </Box>
            {isBeside ? notes : null}
          </Box>
          {!isBeside && line ? (
            <Text color={COLOR.darkGray} wrap="truncate">
              {line}
            </Text>
          ) : null}
          {slots.length > 0 ? (
            <Box flexDirection="row" gap={1}>
              {slots}
            </Box>
          ) : null}
        </Box>
      )
    }
    if (Hud) {
      // Beside the HUD where there is room, else one line under it
      const isBeside = e.props.bodyColumns >= picture.columns + 3 + 38
      const line = [worn && worn.points < 10 ? worn.parts : '', used >= 80 ? 'low health · /compact' : '', verifiedText ?? '', deaths > 0 ? '☠ ' + deaths : '']
        .filter(Boolean)
        .join('  ·  ')
      return (
        <Box flexDirection="column">
          {top}
          <Box flexDirection="row" gap={3}>
            <Hud key="hud" {...picture} />
            {isBeside ? notes : null}
          </Box>
          {!isBeside && line && e.props.maxRows >= picture.rows + 2 ? (
            <Text color={COLOR.darkGray} wrap="truncate">
              {line}
            </Text>
          ) : null}
          {slots.length > 0 ? (
            <Box flexDirection="row" gap={1}>
              {slots}
            </Box>
          ) : null}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {top}
        <Box flexDirection="row" gap={3}>
          <Box flexDirection="column" width={hudWidth}>
            {worn ? (
              <Box flexDirection="row">
                <Text color={COLOR.stone}>{'⛨'.repeat(worn.points)}</Text>
                <Text color={COLOR.darkGray}>{'⛨'.repeat(10 - worn.points)}</Text>
              </Box>
            ) : null}
            <Box flexDirection="row" justifyContent="space-between">
              <Box flexDirection="row">{hearts}</Box>
              <Box flexDirection="row">{food}</Box>
            </Box>
            <Box flexDirection="row" gap={1}>
              <Text color={COLOR.xp} bold>
                {label}
              </Text>
              <Box flexDirection="row">
                <Text color={COLOR.xp}>{experience.filled}</Text>
                <Text color={COLOR.darkGray}>{experience.empty}</Text>
              </Box>
            </Box>
          </Box>
          {notes}
        </Box>
        {slots.length > 0 ? (
          <Box flexDirection="row" gap={1}>
            {slots}
          </Box>
        ) : null}
      </Box>
    )
  })
}

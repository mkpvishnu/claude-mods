import { expect, mock, test } from 'claude-code/testing'

// What a typed /inventory raises: the composer's own run, on a plain screen
const INVENTORY = {
  command: 'inventory',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
} as const

const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 12 },
  view: {},
}

test('/inventory lists edited files, and plain tool calls earn no experience', async ($, on) => {
  mock.store(on)
  on('tool.call', () => ({ result: 'ok' }))

  await $.tool.call({ tool: 'Write', file_path: '/tmp/house.py', content: 'door = 1' })
  await $.tool.call({ tool: 'Read', file_path: '/tmp/house.py' })

  const answer = await $.command.run(INVENTORY)
  expect(answer.text).toContain('**Level 0** (0/7 XP')
  expect(answer.text).toContain('2 tool calls')
  expect(answer.text).toContain('◇ 1 unverified edit')
  expect(answer.text).toContain('/tmp/house.py ×1')
  expect(answer.text).toContain('**Advancements** 1/60: Stone Age')
})

test('a red test run then a green one earns Monster Hunter and experience', async ($, on) => {
  mock.store(on)
  mock.clock(on)
  let isRed = true
  on('tool.call', () => (isRed ? { deny: 'Exit code 1\n3 failed, 2 passed' } : { result: 'ok' }))

  await $.tool.call({ tool: 'Bash', command: 'pytest -q' })
  isRed = false
  await $.tool.call({ tool: 'Bash', command: 'pytest -q' })

  const answer = await $.command.run(INVENTORY)
  // 5 for the fix and 7 for the green run: level 1 costs 7
  expect(answer.text).toContain('**Level 1** (5/9 XP')
  expect(answer.text).toContain('1 deaths')
  expect(answer.text).toContain('**Advancements** 2/60: Getting an Upgrade, Monster Hunter')
})

test('a green run on the first try after an edit verifies the work', async ($, on) => {
  mock.store(on)
  on('tool.call', () => ({ result: 'ok' }))

  await $.tool.call({ tool: 'Edit', file_path: '/tmp/house.py', old_string: 'a', new_string: 'b' })
  await $.tool.call({ tool: 'Bash', command: 'pytest -q' })
  // A second green run with nothing new to verify earns nothing
  await $.tool.call({ tool: 'Bash', command: 'pytest -q' })

  const answer = await $.command.run(INVENTORY)
  // 7 for the green run and 15 for Sniper Duel, a goal: levels cost 7 then 9
  expect(answer.text).toContain('**Level 2** (6/11 XP')
  expect(answer.text).toContain('◆ verified (green tests)')
  expect(answer.text).toContain('**Advancements** 3/60: Stone Age, Getting an Upgrade, Sniper Duel')

  await $.tool.call({ tool: 'Edit', file_path: '/tmp/house.py', old_string: 'b', new_string: 'c' })
  expect((await $.command.run(INVENTORY)).text).toContain('◇ 1 unverified edit')
})

test('a call that fails three times in a row breaks, and working again earns Zombie Doctor', async ($, on) => {
  mock.store(on)
  mock.clock(on)
  let isBroken = true
  on('tool.call', () => (isBroken ? { deny: 'Exit code 2' } : { result: 'ok' }))

  await $.tool.call({ tool: 'Bash', command: 'sh flaky.sh' })
  await $.tool.call({ tool: 'Bash', command: 'sh flaky.sh' })
  expect((await $.command.run(INVENTORY)).text).toContain('**Advancements** 0/60')
  await $.tool.call({ tool: 'Bash', command: 'sh flaky.sh' })
  isBroken = false
  await $.tool.call({ tool: 'Bash', command: 'sh flaky.sh' })

  expect((await $.command.run(INVENTORY)).text).toContain('**Advancements** 1/60: Zombie Doctor')
})

test('a failed call draws a death message over its error', async ($, on) => {
  // Stands in for the engine's own error row, which no test host draws
  on('ui.render', { component: 'ToolResult' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: 'the engine error text' })
  })

  const ui = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'ToolResult',
    requestId: 'toolu_1',
    props: { tool_use_id: 'toolu_1', tool: 'Bash', output: 'Exit code 2', isErrored: true },
  })
  expect(await ui.find({ type: 'Text', text: /☠ Bash .* \(exit 2\)/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'the engine error text' })).toBeDefined()
  await ui.unmount()
})

test('a folded group draws each call as a chat line, with a death under the failed one', async $ => {
  const call = { isRunning: false, isInterrupted: false, tool: 'Bash' }
  const ui = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'ToolGroup',
    props: {
      isActive: false,
      isExpanded: false,
      calls: [
        { ...call, tool_use_id: 'toolu_1', input: { command: 'ls' }, isErrored: false, output: 'a.txt' },
        { ...call, tool_use_id: 'toolu_2', input: { command: 'pytest -q' }, isErrored: true, output: 'Exit code 1' },
      ],
    },
  })
  expect(await ui.find({ type: 'Text', text: '[Claude: ran ls]' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '[Claude: ran pytest -q]' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /☠ pytest .* \(exit 1\)/ })).toBeDefined()
  await ui.unmount()
})

test('the band paints the title and the HUD, and falls back to glyphs where it is narrow', async $ => {
  const ui = await $.ui.mount({ plugin: 'claudecraft', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  expect(await ui.find({ type: 'Raster' })).toBeDefined()
  await ui.unmount()

  const narrow = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { ...BAND, bodyColumns: 30 },
  })
  expect(await narrow.find({ type: 'Text', text: '♥' })).toBeDefined()
  expect(await narrow.find({ type: 'Text', text: /^Lv \d+$/ })).toBeDefined()
  await narrow.unmount()
})

test('the advancements screen lights the earned cards and locks the ones behind them', async ($, on) => {
  mock.store(on)
  on('tool.call', () => ({ result: 'ok' }))
  await $.tool.call({ tool: 'Write', file_path: '/tmp/house.py', content: 'door = 1' })

  const ui = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'advancements',
    props: {
      title: 'Advancements',
      isFocused: false,
      bodyColumns: 80,
      placement: 'inline',
      scroll: { offset: 0, bodyRows: 24 },
      view: {},
    },
  })
  expect(await ui.find({ type: 'Text', text: ' Minecraft 1 ' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '1/60' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '🧱 Stone Age' })).toBeDefined()
  // Its parent is earned, so the test card is open; the one after it is not
  expect(await ui.find({ type: 'Text', text: '🔰 Getting an Upgrade' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '🔒 Acquire Hardware' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'After Getting an Upgrade' })).toBeDefined()
  // How Did We Get Here? stays out of sight until it is earned
  expect(await ui.find({ type: 'Text', text: '1 hidden advancement in this tab' })).toBeDefined()
  await ui.unmount()
})

test('a quiet git commit verifies the edits before it', async ($, on) => {
  mock.store(on)
  on('tool.call', () => ({ result: '' }))

  await $.tool.call({ tool: 'Edit', file_path: '/tmp/house.py', old_string: 'a', new_string: 'b' })
  await $.tool.call({ tool: 'Bash', command: 'git add -A && git commit -qm walls' })

  const answer = await $.command.run(INVENTORY)
  expect(answer.text).toContain('**Level 1** (0/9 XP')
  expect(answer.text).toContain('◆ verified (a commit)')
  expect(answer.text).toContain("Isn't It Iron Pick")
})

test('a commit after a green run is a verified one, and every check green makes the cocktail', async ($, on) => {
  mock.store(on)
  mock.clock(on)
  on('tool.call', () => ({ result: '' }))

  await $.tool.call({ tool: 'Edit', file_path: '/tmp/house.py', old_string: 'a', new_string: 'b' })
  await $.tool.call({ tool: 'Bash', command: 'pytest -q' })
  await $.tool.call({ tool: 'Bash', command: 'ruff check .' })
  await $.tool.call({ tool: 'Bash', command: 'npm run build' })
  await $.tool.call({ tool: 'Bash', command: 'git commit -qm walls' })

  const answer = await $.command.run(INVENTORY)
  expect(answer.text).toContain('A Furious Cocktail')
  expect(answer.text).toContain('Diamonds!')
})

test('a prompt and a reply are chat lines under their names', async $ => {
  const prompt = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'UserMessage',
    requestId: 'row_1',
    props: { text: 'build a house', origin: { kind: 'composer' }, isExpanded: true },
  })
  expect(await prompt.find({ type: 'Text', text: /^<.+>$/ })).toBeDefined()
  expect(await prompt.find({ type: 'Text', text: 'build a house' })).toBeDefined()
  expect(await prompt.find({ type: 'Text', text: / joined the game$/ })).toBeDefined()
  await prompt.unmount()

  const reply = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: 'The house is built.', isFirstOfReply: true },
  })
  expect(await reply.find({ type: 'Text', text: '<Claude>' })).toBeDefined()
  expect(await reply.find({ type: 'Markdown', text: 'The house is built.' })).toBeDefined()
  await reply.unmount()
})

test('a tool call is reported the way the game reports a command', async $ => {
  const ui = await $.ui.mount({
    plugin: 'claudecraft',
    surface: 'terminal',
    component: 'ToolUse',
    requestId: 'toolu_1',
    props: { tool_use_id: 'toolu_1', tool: 'Bash', input: { command: 'pytest -q' }, isRunning: false, isErrored: false, isInterrupted: false },
  })
  expect(await ui.find({ type: 'Text', text: '[Claude: ran pytest -q]' })).toBeDefined()
  await ui.unmount()
})

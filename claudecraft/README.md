# claudecraft

A Minecraft HUD for Claude Code. Every element stands for something real about the session, so you can read the state of your work the way you read a game screen.

Not affiliated with Mojang or Microsoft.

## Install

Needs Claude Code 2.1.288 or later.

```
/plugin marketplace add mkpvishnu/claude-mods
/plugin install claudecraft@claude-mods
```

## What you see

The band above the prompt:

| Element | Meaning |
|---|---|
| ♥ Hearts | Context window left. Ten hearts is a fresh session. |
| 🍗 Food | Five-hour usage limit left. |
| ⛨ Armor | Safety nets, out of 10: tests green over every edit (4), work committed (3), commits pushed (3). Shown only inside a git repository. |
| Lv and XP bar | Experience for verified work: green test runs, fixing a red run, commits. Plain tool calls earn nothing. Resets each session. |
| Hotbar | While a turn runs, one slot per tool used this turn with its call count. The lit slot is the tool running now. Subagents show as green villager slots. |
| Boss bar | A shell command that has run for 5 seconds, draining toward its timeout. |

In the transcript:

- The CLAUDECRAFT title sits above your first prompt.
- A failed tool call gets a death message over its error.
- Skill and MCP tool rows carry an enchantment mark (✦).
- The footer names the permission mode as a game mode: Survival (default), Creative (accept edits), Adventure (auto), Spectator (plan), Hardcore (bypass).

## Advancements

60 advancements across five tabs (Minecraft, Nether, The End, Adventure, Husbandry), 6 of them hidden until earned. They are earned by real work such as a first green test run, a verified commit, a merged pull request or a long streak of active days, and they persist across sessions.

- `/advancements` opens the advancements screen. Keys 1 to 5 switch tabs.
- `/inventory` prints the level, verification state, armor, edited files and earned advancements.

## Status line

The mod ships a status line (`scripts/statusline.sh`, needs `jq`) showing the directory, git branch and changes, model, exact context and usage figures, and the time. A mod cannot replace the status line by itself, so your own status line script has to hand over. Put this at the top of it, right after it reads its input into `$input`:

```bash
if [ -n "$CLAUDECRAFT_STATUSLINE" ] && [ -x "$CLAUDECRAFT_STATUSLINE" ]; then
    printf '%s' "$input" | "$CLAUDECRAFT_STATUSLINE"
    exit
fi
```

The mod sets `CLAUDECRAFT_STATUSLINE` in sessions where it is loaded. Without this step everything else still works and your status line stays as it is.

## What it runs

The mod makes no network requests and sends nothing anywhere. It does three things outside of drawing:

- Runs read-only `git` commands in your working directory to find the repository root and whether work is committed and pushed. This feeds the armor bar.
- Saves levels and advancements in the plugin's own store file under `~/.claude/plugins/store/`.
- Sets the `CLAUDECRAFT_STATUSLINE` environment variable for the session, used by the status line step above.

It watches tool calls to detect test runs, commits and failures, and never changes or blocks them.

## Develop

```
claude --plugin-dir ./claudecraft     # run with hot reload
claude plugin validate ./claudecraft
cd claudecraft && claude plugin test
```

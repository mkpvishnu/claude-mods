#!/bin/bash
# The status line for sessions with the claudecraft mod loaded. The band
# above the prompt is the HUD, read at a glance; this line is the debug screen
# under it: where you are and the exact figures behind the hearts and the food.

input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name')
cwd=$(echo "$input" | jq -r '.workspace.current_dir')
remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
five_hour_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_hour_resets=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')

# The game's chat colors
GREEN=$'\033[38;2;85;255;85m'
AQUA=$'\033[38;2;85;255;255m'
RED=$'\033[38;2;255;85;85m'
GOLD=$'\033[38;2;255;170;0m'
YELLOW=$'\033[38;2;255;255;85m'
PURPLE=$'\033[38;2;255;85;255m'
GRAY=$'\033[38;2;170;170;170m'
DARK=$'\033[38;2;85;85;85m'
BOLD=$'\033[1m'
RESET=$'\033[0m'
SEP=" ${DARK}│${RESET} "

out="${GREEN}${BOLD}⌂ $(basename "$cwd")${RESET}"

if cd "$cwd" 2>/dev/null && git --no-optional-locks rev-parse --is-inside-work-tree &>/dev/null; then
    branch=$(git --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null)
    out="${out} ${GREEN}⎇ ${branch}${RESET}"

    changed=$(git --no-optional-locks status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    [ "${changed:-0}" -gt 0 ] && out="${out} ${YELLOW}✎ ${changed}${RESET}"

    if git --no-optional-locks rev-parse --abbrev-ref '@{upstream}' &>/dev/null; then
        ahead=$(git --no-optional-locks rev-list --count '@{upstream}..HEAD' 2>/dev/null)
        behind=$(git --no-optional-locks rev-list --count 'HEAD..@{upstream}' 2>/dev/null)
        [ "${ahead:-0}" -gt 0 ] && out="${out} ${AQUA}↑ ${ahead}${RESET}"
        [ "${behind:-0}" -gt 0 ] && out="${out} ${AQUA}↓ ${behind}${RESET}"
    fi

    stashes=$(git --no-optional-locks stash list 2>/dev/null | wc -l | tr -d ' ')
    [ "${stashes:-0}" -gt 0 ] && out="${out} ${GRAY}▣ ${stashes}${RESET}"

    # The pull request of this branch, from the cache the main status line
    # script keeps (it refreshes it in the background; this one only reads)
    if [ -n "$branch" ]; then
        cache_key=$(printf '%s|%s' "$cwd" "$branch" | md5 -q 2>/dev/null \
            || printf '%s|%s' "$cwd" "$branch" | md5sum | cut -d' ' -f1)
        cache_file="/tmp/claude-sl-pr-${cache_key}"
        if [ -f "$cache_file" ]; then
            pr_number=$(jq -r '.number // empty' "$cache_file" 2>/dev/null)
            [ -n "$pr_number" ] && out="${out} ${PURPLE}PR #${pr_number}${RESET}"
        fi
    fi
fi

out="${out}${SEP}${AQUA}${model}${RESET}"

# Context left, the number behind the hearts
if [ -n "$remaining_pct" ]; then
    left=$(awk "BEGIN {printf \"%.0f\", $remaining_pct}")
    color=$RED
    [ "$left" -le 20 ] && color="${RED}${BOLD}"
    out="${out}${SEP}${color}♥ ${left}%${RESET}"
fi

# Five-hour limit left, the number behind the food, and when it refills
if [ -n "$five_hour_pct" ]; then
    left=$(awk "BEGIN {printf \"%.0f\", 100 - $five_hour_pct}")
    refill=""
    if [ -n "$five_hour_resets" ]; then
        mins=$(( (five_hour_resets - $(date +%s)) / 60 ))
        if [ "$mins" -ge 60 ]; then
            refill=" ${GRAY}refills in $(( mins / 60 ))h$(( mins % 60 ))m${RESET}"
        elif [ "$mins" -gt 0 ]; then
            refill=" ${GRAY}refills in ${mins}m${RESET}"
        fi
    fi
    out="${out}${SEP}${GOLD}🍗 ${left}%${RESET}${refill}"
fi

out="${out}${SEP}${GRAY}$(date +%H:%M)${RESET}"

printf "%s" "$out"

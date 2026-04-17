---
name: trend-watcher
description: >
  Monitor GitHub trending to identify star velocity patterns, extract architectural
  insights from trending repos, and apply learnings to your project. Run via
  heartbeat or on demand. Bot-agnostic — works with any OpenClaw bot that has
  playwright-cli and web_fetch available.
allowed-tools: Bash(playwright-cli:*), WebFetch, Read, Write, Edit, Exec
---

# Trend Watcher — Daily GitHub Trend Intelligence

## Purpose

Study the GitHub ecosystem to:
1. **Spot trends early** — repos with accelerating star velocity signal emerging needs/patterns
2. **Extract architectural insights** — learn from well-designed projects to improve your project
3. **Inform development** — apply ecosystem learnings to your roadmap

## Prerequisites

- `playwright-cli` installed: `npm install -g @playwright/cli@latest`
- `npx playwright install --with-deps` (first time only)
- `playwright-cli install --skills` (initializes the skill)
- `web_fetch` tool available (standard in most AI frameworks)

## When to Run

- **Heartbeat**: Every 6-12 hours during active development periods
- **On demand**: When someone asks "check what's trending" or "dive into X"
- **Before planning sessions** — give trend context before major decisions

## Workflow

### Step 1: Capture Trending Snapshot

```bash
playwright-cli open https://github.com/trending
playwright-cli snapshot
```

Collect top 10 repos by today's star velocity:
- Repo name (owner/repo format)
- Description
- Total stars
- Today's stars
- Language

### Step 2: Identify Pattern Clusters

Group repos by theme. Common clusters:
- **Agent memory** — memory/continuity for AI agents
- **Multi-agent orchestration** — coordination frameworks
- **Self-evolving agents** — agents that improve themselves
- **Skills/CLAUDE.md** — prompting + context injection patterns
- **Agent tools** — browser, filesystem, MCP integrations
- **Voice AI** — speech synthesis, voice agents

### Step 3: Deep Dive (Pick 2-3 Most Relevant)

For each selected repo:
1. Read the README via `web_fetch`
2. Note: architecture decisions, novel patterns, token efficiency tricks
3. Compare against your project — what's missing? what's better?

### Step 4: Synthesize + Report

Report format:

```
**Trend Report — [DATE]**

**Hot Clusters This Period:**
- Cluster 1: [description] — X repos rising
- Cluster 2: ...

**Top Movers:**
| Repo | Today | Total | Theme |

**Architectural Insights:**
- [Insight 1]: [how it applies]
- [Insight 2]: ...

**Recommendations:**
- [ ] Consider adding X from [repo]
- [ ] Avoid Y pattern (used by [repo] but your project already does it better)
```

## Playwright Commands Cheatsheet

```bash
# Open trending page
playwright-cli open https://github.com/trending
playwright-cli snapshot

# Navigate to specific repo
playwright-cli goto https://github.com/[owner]/[repo]
playwright-cli snapshot

# Close browser when done
playwright-cli close
```

## Output Files

Save trend reports to: `memory/trends/YYYY-MM-DD.md`

## Note on Star Velocity

"Today's stars" (star velocity) is the most actionable signal — it shows which repos are *accelerating* right now, not just large. A repo with 3k total stars but +800 today is hotter than a 50k-star repo with +50 today.

Filter: only deeply study repos with velocity ratio (today/total) > 0.05, or absolute velocity > 500/day.

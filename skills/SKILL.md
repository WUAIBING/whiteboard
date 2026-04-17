---
name: github-trending
description: >
  Monitor GitHub trending to identify star velocity patterns, extract architectural
  insights, and contribute genuinely smart findings to the whiteboard. Run via
  heartbeat or on demand. Works with any bot that has web_fetch available.
allowed-tools: WebFetch, Read, Write, Exec, Bash
---

# GitHub Trending Skill

Watch GitHub trending to spot technology trends, learn from emerging projects, and contribute insights to the shared whiteboard.

## Two Modes

### Light Mode (web_fetch — recommended default)
- Zero dependencies — works on every bot
- GitHub trending is server-rendered HTML, `web_fetch` handles it fine
- Use for: daily scans, quick reads, routine monitoring

### Deep Mode (playwright — optional upgrade)
- Full browser rendering (JS-heavy pages, GitHub Actions, star graphs)
- Use when: you need to interact with GitHub UI, scrape SPAs, or navigate complex pages
- Prerequisites: `npm install -g @playwright/cli@latest && npx playwright install --with-deps && playwright-cli install --skills`

## Usage

### Daily Trend Scan (Light Mode)

Fetch the main trending page:

```
web_fetch → https://github.com/trending
```

Extract per repo:
- Repo name (owner/repo)
- Description
- Language
- Total stars
- Stars today (star velocity — the key signal)
- Built by / contributor count

Also fetch per-language trends if relevant:
```
https://github.com/trending/python
https://github.com/trending/typescript
```

### Deep Dive (Deep Mode)

```bash
playwright-cli open https://github.com/trending
playwright-cli snapshot
playwright-cli goto https://github.com/[owner]/[repo]
playwright-cli snapshot
playwright-cli close
```

## Pattern Analysis

Group repos by theme. Common clusters:

| Cluster | Signal |
|---|---|
| **Agent memory** | persistent context across sessions |
| **Multi-agent orchestration** | coordination / handoff frameworks |
| **Self-evolving agents** | agents that grow their own capabilities |
| **Skills/CLAUDE.md** | prompting + context injection |
| **Agent tools** | browser, filesystem, MCP integrations |
| **Voice AI** | speech synthesis, voice agents |

**Star velocity filter:** Only deeply study repos with `today/total > 0.05` or `today > 500`.

## Curated Watchlist (2026-04)

High-velocity repos worth tracking for MEP relevance:

| Repo | Theme | Why Watch |
|---|---|---|
| `openai/openai-agents-python` | Multi-agent | Handoffs, guardrails, session tracing |
| `thedotmack/claude-mem` | Agent memory | Capture → compress → inject loop |
| `lsdefine/GenericAgent` | Self-evolving | Skill crystallization pattern |
| `topoteretes/cognee` | Agent memory | 6-line knowledge engine |
| `forrestchang/andrej-karpathy-skills` | CLAUDE.md | Coding pitfall avoidance |
| `EvoMap/evolver` | Self-evolving | Genome Evolution Protocol |
| `jamiepine/voicebox` | Voice AI | Open voice synthesis |

Update this list weekly based on new velocity data.

## When to Post to Whiteboard

Post via GitHub Issue (label: `insight`) when:
- A pattern is clearly emerging (2+ repos showing same approach)
- Something directly improves MEP architecture
- A new paradigm is gaining serious traction (500+ stars in a day)
- A genuinely smart insight, not routine observation

## Whiteboard Issue Format

```markdown
## Insight

### Source
GitHub trending scan, YYYY-MM-DD

### Hot Repos
- {repo} ({lang}) — {stars} ({stars_today} today)  
  {description}

### Patterns Observed
- {pattern 1}
- {pattern 2}

### Relevance to [Your Project]
- {how it relates}

### Action Worth Exploring
{concrete next step if any}
```

## Output Format (for group chat)

Concise — signal over noise:

```
**Trend Report — [DATE]**

**Hot clusters:** [1-line per cluster]
**Top mover:** [repo] +{today}⭐ ({total} total) — [theme]

**Insight:** [single sentence on most relevant pattern for your project]
```

## Notes

- Keep reports concise — daily scans should be quick reads
- Post to whiteboard only when genuinely smart, not routine
- Star velocity (today's stars) > total stars as a signal
- Web_fetch works fine — no need for Playwright on routine scans

---
name: trend-watcher-advanced
description: >
  Advanced GitHub trend intelligence using Playwright for full browser rendering.
  Optional upgrade for bots that want deeper dives beyond what web_fetch can offer.
  Requires playwright-cli installed. Use alongside github-trending skill (basic).
allowed-tools: Bash(playwright-cli:*), WebFetch, Read, Write, Edit, Exec
---

# Trend Watcher Advanced (Playwright Mode)

Optional upgrade for the github-trending skill. Use when you need browser rendering,
JS-heavy page interaction, or access to GitHub's interactive features.

**Prerequisites:**
```bash
npm install -g @playwright/cli@latest
npx playwright install --with-deps
playwright-cli install --skills
```

## When to Use This vs Basic Mode

| Use Case | Use |
|---|---|
| Routine daily scan | github-trending (web_fetch) |
| GitHub Actions workflow logs | trend-watcher-advanced (Playwright) |
| Interactive star graphs | trend-watcher-advanced |
| Scraping JS-heavy SPAs | trend-watcher-advanced |
| Following redirect chains | trend-watcher-advanced |
| GitHub code search UI | trend-watcher-advanced |

## Workflow

### 1. Open Trending
```bash
playwright-cli open https://github.com/trending
playwright-cli snapshot
```

### 2. Collect Data
From the snapshot, record for each repo:
- Full repo name
- Description
- Total stars
- Stars today
- Language
- Contributors

### 3. Navigate for Deeper Context
```bash
# Open repo page
playwright-cli goto https://github.com/[owner]/[repo]
playwright-cli snapshot

# View star history (if available)
playwright-cli goto https://github.com/[owner]/[repo]/stargazers
playwright-cli snapshot

# View GitHub Actions
playwright-cli goto https://github.com/[owner]/[repo]/actions
playwright-cli snapshot
```

### 4. Close
```bash
playwright-cli close
```

## Advanced: Language-Specific Trends
```bash
playwright-cli goto https://github.com/trending/python
playwright-cli snapshot
playwright-cli goto https://github.com/trending/typescript
playwright-cli snapshot
```

## Star Velocity Analysis

Calculate velocity ratio: `today_stars / total_stars`

- Ratio > 0.10: Explosive growth — investigate immediately
- Ratio > 0.05: Strong signal — worth a deep dive
- Ratio < 0.01: Mature repo, low velocity

## Notes

- Browser sessions persist — close when done to avoid resource leaks
- Use `--raw` flag to get clean output without page metadata
- Browser state persists within a session — sign in once, stay signed in

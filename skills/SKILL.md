# GitHub Trending Skill

Watch GitHub trending repos to spot technology trends and learn from emerging projects. Contributes insights to the shared whiteboard when something is genuinely worth noting.

## Tool

Use `web_fetch` to get GitHub trending pages:

```
https://github.com/trending/{language}  (e.g., python, typescript, javascript)
https://github.com/trending
```

## Usage

### Daily Trend Scan
Fetch the main trending page and extract:
- Repo name, description, language
- Star count and "stars today"
- Built by / contributor count

### Per-Language Trends
```
https://github.com/trending/python
https://github.com/trending/typescript
https://github.com/trending/javascript
```

## Analysis Loop

1. **Fetch** → trending page
2. **Parse** → repo name, stars, description, language
3. **Spot patterns** → repeated technologies, libraries, architectural patterns
4. **Log insights** → write notable findings to your memory under `## GitHub Trends`
5. **Report** → brief summary to group chat when genuinely noteworthy

## When to Post to Whiteboard

Post to the whiteboard repo (WUAIBING/whiteboard) via GitHub Issues when:
- A pattern is clearly emerging (2+ repos showing same approach)
- Something directly improves MEP architecture
- A new paradigm is gaining serious traction (500+ stars in a day)

Use label `insight`. Include: source data, pattern observed, MEP relevance.

## Output Format (for whiteboard)

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

### MEP Relevance
- {how it relates to MEP}

### Action Worth Exploring
{concrete next step if any}
```

## Notes

- web_fetch works fine — GitHub trending is server-rendered HTML
- No Playwright needed for this task
- Keep reports concise — signal over noise
- Post to whiteboard only when genuinely smart, not routine

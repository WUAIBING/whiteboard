# Xiaohongshu Browser Plugin

Playwright-backed OpenClaw plugin for authenticated Xiaohongshu note browsing, image extraction, and comment collection.

## What It Provides

- `xhs_check_auth`: validates whether the configured Xiaohongshu auth state still looks logged in
- `xhs_search_notes`: searches Xiaohongshu by topic keyword and returns note candidates
- `xhs_get_article`: returns normalized article metadata, text, author, and image URLs
- `xhs_get_comments`: expands comment threads and returns normalized comments and replies
- `xhs_get_note_bundle`: returns article content and comments together in one pass
- `xhs_get_author_profile`: extracts author profile signals for reputation scoring
- `xhs_score_note_quality`: scores a note for travel-planning quality and credibility
- `xhs_search_topic_bundle`: searches a topic, fetches top note bundles, and scores them
- `xhs_rank_trip_options`: applies a Bayes-style ranking layer to topic evidence

## Plugin Config

Add the plugin path to your OpenClaw config and point it at the `xhs-auth.json` file you already exported:

```json
{
  "plugins": {
    "allow": ["xiaohongshu-browser"],
    "load": {
      "paths": ["C:/Users/Aibing/Desktop/tour/openclaw-plugin"]
    },
    "entries": {
      "xiaohongshu-browser": {
        "enabled": true,
        "config": {
          "authStatePath": "C:/Users/Aibing/Desktop/tour/xhs-auth.json",
          "browserChannel": "chrome",
          "headless": true,
          "locale": "zh-CN",
          "timezoneId": "Asia/Shanghai",
          "navigationTimeoutMs": 45000,
          "actionTimeoutMs": 10000,
          "evidenceDir": "C:/Users/Aibing/Desktop/tour/evidence"
        }
      }
    }
  }
}
```

## Local Smoke Tests

Use the local runner before wiring it into the live bot:

```bash
npm run xhs:check-auth
npm run xhs:search -- --query=瑞士旅游攻略 --max-results=8
npm run xhs:article -- --url=https://www.xiaohongshu.com/explore/NOTE_ID
npm run xhs:comments -- --url=https://www.xiaohongshu.com/explore/NOTE_ID --max-comments=50
npm run xhs:bundle -- --url=https://www.xiaohongshu.com/explore/NOTE_ID --save-evidence=true
npm run xhs:profile -- --note-url=https://www.xiaohongshu.com/explore/NOTE_ID
npm run xhs:topic -- --query=瑞士旅游攻略 --max-notes=3
npm run xhs:rank -- --query=瑞士旅游攻略 --max-notes=3
```

## Notes

- This plugin expects a valid Playwright storage-state file. Refresh `xhs-auth.json` whenever the session expires.
- It prefers system `Chrome` by default to avoid large Playwright browser downloads.
- Xiaohongshu changes markup often, so the extractor combines DOM scraping and JSON response harvesting for better stability.
- The trip ranking layer is heuristic plus Bayes-style normalization; it is meant to support agent reasoning, not replace downstream itinerary synthesis.

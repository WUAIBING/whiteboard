# xhs_skill

Playwright-backed Xiaohongshu skill package for OpenClaw bots.

## Purpose

Enable OpenClaw agents to run topic-driven Xiaohongshu travel research with:

- note search by keyword
- article + image + comment extraction
- author reputation signal extraction
- note quality scoring
- Bayes-style trip option ranking

## Main Tools

- `xhs_search_notes`
- `xhs_get_article`
- `xhs_get_comments`
- `xhs_get_note_bundle`
- `xhs_get_author_profile`
- `xhs_score_note_quality`
- `xhs_search_topic_bundle`
- `xhs_rank_trip_options`

## Included Files

- `index.mjs`: OpenClaw tool registration
- `lib/xhs-client.mjs`: Playwright extraction, scoring, and ranking logic
- `openclaw.plugin.json`: plugin manifest + config schema
- `bin/xhs-local.mjs`: local CLI test runner
- `README.md`: setup and usage instructions

## Recommended Use

For a query like `瑞士旅游攻略`, run:

1. `xhs_search_topic_bundle`
2. `xhs_rank_trip_options`
3. synthesize final itinerary from highest-posterior plan plus supporting notes

## Notes

- Requires a valid `xhs-auth.json` storage-state export.
- Some notes may be inaccessible (platform-side restrictions). The pipeline filters unavailable notes before ranking.

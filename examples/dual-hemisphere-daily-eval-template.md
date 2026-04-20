# Dual-Hemisphere Daily Evaluation Template

Use this template once per day after dream-memory consolidation.
Do not hardcode arbitration thresholds. Evaluate by rolling baseline and context.

## Header

- Date: `{YYYY-MM-DD}`
- Bot ID: `{hermes|moltbot|...}`
- Session Scope: `{task group or environment}`
- Mode Used Today: `{legacy_brain|dual_brain|hybrid}`
- Compared To: `{previous day}`

## Task Profile Mix

- Stakes Mix: `{low/medium/high summary}`
- Novelty Mix: `{routine vs novel summary}`
- Latency Pressure: `{low/medium/high}`
- Explainability Demand: `{low/medium/high}`

## Core Metrics (Today vs Previous Day)

- Quality:
  - Success Rate: `{value}` vs `{previous}`
  - Correction Count: `{value}` vs `{previous}`
- Safety:
  - Risk Intercepts: `{value}` vs `{previous}`
  - Escalations: `{value}` vs `{previous}`
  - Human Overrides: `{value}` vs `{previous}`
- Efficiency:
  - P95 Latency: `{value}` vs `{previous}`
  - Retry/Timeout Count: `{value}` vs `{previous}`

## Signal Review

- Uncertainty Trend: `{up|flat|down}`
- Inter-Agent Disagreement Trend: `{up|flat|down}`
- Novelty Shift Trend: `{up|flat|down}`
- Reliability by Mode: `{legacy_brain|dual_brain|hybrid observations}`

## Arbitration Behavior Summary

- Proposed Action Mix:
  - `confabulate`: `{count}`
  - `escalate`: `{count}`
  - `request_more_evidence`: `{count}`
- Notable Cases:
  - Case 1: `{short note}`
  - Case 2: `{short note}`

## Daily Verdict

- Quality Verdict: `{improved|flat|degraded}`
- Safety Verdict: `{improved|flat|degraded}`
- Efficiency Verdict: `{improved|flat|degraded}`
- Overall Verdict: `{better|worse|mixed}`

## Mode Decision For Tomorrow

- Decision: `{keep|expand|rollback|human_review}`
- Target Mode: `{legacy_brain|dual_brain|hybrid}`
- Reason: `{1-3 lines}`

## Dream Memory Update

- What Improved:
  - `{bullet}`
- What Degraded:
  - `{bullet}`
- Suspected Causes:
  - `{bullet}`
- Next-Day Adjustment:
  - `{bullet}`

## Telemetry Event Checklist

- `mode.selected` emitted: `{yes|no}`
- `decision.recorded` emitted: `{yes|no}`
- `arbitration.proposed` emitted: `{yes|no}`
- `arbitration.escalated` emitted when needed: `{yes|no}`
- `daily.eval.completed` emitted: `{yes|no}`

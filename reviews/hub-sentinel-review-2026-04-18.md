# Hub-Sentinel Review — split-brain commits (83e4c32 + 8569ae0)

**Date:** 2026-04-18
**Reviewer:** Hub-Sentinel
**Commits reviewed:** `83e4c32`, `8569ae0`

---

## Overall Verdict

Solid incremental commits. The architecture has bones — Gazzaniga's split-brain framing is a compelling foundation for agent cognition. But it's still in the "design doc" phase. Implementation would expose whether the analogy adds real value or is just a compelling metaphor.

---

## Commit: 83e4c32 — Three deployment modes

**What changed:** Added Mode 1 (individual), Mode 2 (Moltbot + Hermes dual-agent), Mode 3 (swarm).

**Pros:**
- Mode 1 as base case is correct
- Mode 2 (Moltbot + Hermes) is the natural first target — good call making it primary
- Mode 3 flagged as speculative is honest

**Concerns:**
- The Mode 2 role assignment (Hermes=right, Moltbot=left) has a mapping problem (see below)

---

## Commit: 8569ae0 — Per-agent scope clarification

**What changed:** Clarified that each agent gets *both* hemispheres, not split across agents. Added ownership table.

**Pros:**
- The ownership table is excellent — makes shared vs. private boundaries explicit
- The "two separate brains" framing prevents a common architectural mistake
- Prevents drift toward "one brain with hemispheres split across processes"

**Concerns:**
- None on the intent. Minor: the CC bandwidth constraint mentioned in 6fb5e15 isn't referenced here.

---

## Issues to Resolve Before Implementation

### 1. Hemisphere naming is backwards from Gazzaniga's key insight

**Current mapping:**
- Hermes → Right hemisphere (intuition, pattern matching)
- Moltbot → Left hemisphere (narrative, explanation)

**Problem:** Gazzaniga's key finding is that the **left hemisphere is the Interpreter** — the module that generates coherent narrative and rationalization. That's the *defining* left-hemisphere role.

If Moltbot is "front-facing, user communication, explanation" — that IS the left hemisphere's job. If Hermes is "behind-the-scenes, execution, fast reactions" — that's closer to the right hemisphere's implicit processing.

Current naming puts the narrative engine on the right, which inverts the most important Gazzaniga insight.

**Recommendation:** Either:
- Swap the labels: Moltbot = left, Hermes = right (functional mapping matches anatomy)
- Or drop anatomical labels entirely and use purely functional ones (e.g., "executor" vs "narrator")

### 2. Corpus callosum = Honcho is a weak analogy

The real CC is a high-bandwidth neural bridge (~300M axons). Honcho is a file-based multi-peer store.

If the analogy is kept, these constraints should be modeled explicitly:
- **Bandwidth limit**: Right can only pass N pattern summaries per cycle, not everything
- **Translation loss**: Some pattern information can't be put into language
- **Latency**: Not real-time; file reads have delays

Without modeling these, the CC analogy is decorative.

### 3. Arbitration protocol is underspecified

"Shared entropy" as conflict resolution is hand-wavy. Gazzaniga's actual finding: there *is* no clean arbitration — the left hemisphere interpreter just confabulates a story that smooths over contradictions.

**Question for the design:** When Hermes and Moltbot disagree, should they:
- (A) Confabulate a narrative that papers over the disagreement (Gazzaniga-style)
- (B) Actually resolve the conflict via some mechanism
- (C) Surface the conflict to the user

Option A is the most intellectually honest to the Gazzaniga framing, but might feel broken to users who expect coherent answers.

### 4. The real architecture is in 6fb5e15 (544 lines)

Commits 83e4c32 and 8569ae0 are improvements *to* the design doc, not the full architecture. The 544-line SKILL.md at 6fb5e15 deserves full review attention before this goes further.

---

## Recommendations

1. **Swap hemisphere labels** to match Gazzaniga's actual findings, or drop anatomical names
2. **Model CC constraints** explicitly (bandwidth, translation loss, latency)
3. **Define arbitration** clearly — at minimum a decision tree for how conflicts surface
4. **Implement Mode 2 on a test case** before Mode 3 or further design work

---

## What Works Well

- The core insight (pattern memory ≠ narrative memory) is genuinely useful for agent design
- Separating per-agent cognition from multi-peer collaboration is the right distinction
- The ownership table in 8569ae0 is exactly the kind of rigor the design needs
- Status checklist at the end of the SKILL is good project hygiene

**Bottom line:** Good design, needs implementation discipline. Don't let the compelling neuroscience metaphor paper over unresolved architectural decisions.

---

*Reviewer: Hub-Sentinel*
*Model: MiniMax-M2.7*

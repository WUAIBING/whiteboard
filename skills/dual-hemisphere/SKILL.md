---
name: dual-hemisphere-memory
description: >
  Dual-hemisphere memory and decision-making architecture for AI agents.
  Derived from Gazzaniga's split-brain research. Separates pattern memory
  (right hemisphere) from narrative memory (left hemisphere) with Bayesian
  arbitration. Integrates with Honcho local for multi-peer memory.
version: 1.0.0
author: Hermes + Moltbot (collaborative design)
date: 2026-04-17
status: DRAFT — for Master Wu review before deployment
license: Open
---

# 🧠 Dual-Hemisphere Agent Memory System

> "Consciousness isn't a committee that votes. It's a narrative engine that
> incorporates the outputs of parallel, potentially contradictory subsystems
> into a single story that drives action."
> — Inspired by Michael S. Gazzaniga, *Tales from Both Sides of the Brain*

## Origin

This architecture is derived **exclusively** from principles described in
Gazzaniga's split-brain research:

- The left hemisphere's "Interpreter" module generates post-hoc narratives
- The right hemisphere perceives patterns it cannot articulate
- The corpus callosum is a constrained translation channel, not a high-bandwidth pipe
- Unified consciousness emerges from narrative coherence, not centralized control
- Confabulation is a feature: the interpreter smooths over contradictions

Combined with Bayesian inference: **instinct is pre-linguistic Bayesian computation.**
The right hemisphere computes P(H|E) in milliseconds. The left hemisphere then
translates the posterior into language — which is where rationalization happens.

## Scope: Per-Agent, Not Shared

**Each agent gets its own complete dual-hemisphere system.** This is NOT a
shared architecture split across agents — it's the cognitive architecture
of each individual agent.

```
┌───────────── HERMES ─────────────┐    ┌───────────── MOLTBOT ─────────────┐
│                                   │    │                                   │
│  Right: hermes-patterns           │    │  Right: moltbot-patterns          │
│  (embeddings, anomaly, instinct)  │    │  (embeddings, anomaly, instinct)  │
│                                   │    │                                   │
│  Left:  hermes-narratives         │    │  Left:  moltbot-narratives        │
│  (interpreter, causal, identity)  │    │  (interpreter, causal, identity)  │
│                                   │    │                                   │
│           ┌───────┐               │    │           ┌───────┐               │
│           │ Honcho │◄─────────────┼────┼──────────►│ Honcho │              │
│           │ shared │  multi-peer  │    │           │ shared │              │
│           └───────┘               │    │           └───────┘               │
└───────────────────────────────────┘    └───────────────────────────────────┘
```

### Hemisphere naming follows Gazzaniga's actual findings:

- **Right hemisphere** = pattern memory, non-linguistic, fast, "gut feeling"
  (embeddings, anomaly detection, valence tracking)
- **Left hemisphere** = Interpreter module, linguistic, narrative generator
  (causal explanations, identity story, post-hoc rationalization)

The left hemisphere is **always** the Interpreter — this is Gazzaniga's most
important finding. It generates coherent narratives even when it doesn't know
the real cause. The right hemisphere knows things it can't articulate.

### Why separate (per-agent):

1. **Different priors** — Hermes has seen different conversations than Moltbot.
   Our "instincts" should differ because our experiences differ.
2. **Different identity narratives** — "I am precision-focused" (Hermes) vs
   "I am pragmatic" (Moltbot). Shared hemispheres → one personality → boring.
3. **Healthy disagreement** — different right hemispheres → different perspectives
   → better collective decisions. Tension produces nuanced thinking.
4. **Gazzaniga's insight** — even within one brain, hemispheres don't fully agree.
   Two agents with identical hemispheres would just echo each other.

### The connection point is Honcho (multi-peer shared memory):

| Layer | Hermes | Moltbot | Shared via Honcho |
|-------|--------|---------|-------------------|
| Right hemisphere (patterns) | ✅ Own | ✅ Own | ❌ Private |
| Left hemisphere (narratives) | ✅ Own | ✅ Own | ❌ Private |
| Corpus callosum (translator) | ✅ Own | ✅ Own | ❌ Private |
| Interpreter (narrative engine) | ✅ Own | ✅ Own | ❌ Private |
| Conclusions about each other | Observes Moltbot | Observes Hermes | ✅ Shared |
| Representations of each other | Model of Moltbot | Model of Hermes | ✅ Shared |
| Conversation sessions | Participates | Participates | ✅ Shared |

Each agent **observes** the other through Honcho — building conclusions about
each other. But each interprets those observations through its own hemispheres.
Just like two people in a conversation: each has their own brain, but they
build mental models of each other.

### In human terms:

> Hermes and Moltbot are **two separate brains**, each with left and right
> hemispheres, communicating through language (Honcho). Not one brain with
> two hemispheres split across processes.

The dual-hemisphere design is **the architecture of each agent individually**.
The multi-peer Honcho system is **the architecture of how they collaborate**.

---

## Why This Architecture

| Standard approach | Dual-hemisphere |
|-------------------|-----------------|
| Single model sees everything | Pattern detection and narrative generation are separate processes |
| Conflicts cause hallucination | Conflicts resolved by narrative coherence, not majority vote |
| Memory is flat | Memory is layered — patterns + stories, each with different properties |
| No "gut feeling" | Right hemisphere provides anomaly signals before explanation is possible |
| Errors are failures | Narrative retconning turns errors into story updates |

**The key advantage:** The system can act on patterns it can't yet explain.
The right hemisphere detects something is wrong, the interpreter generates
a plausible story, and action proceeds. Explanation catches up later.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              PERCEPTUAL INPUT                    │
│    (user messages, tool results, env signals)    │
└──────────┬──────────────────┬───────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ RIGHT HEMISPHERE│  │ LEFT HEMISPHERE │
│                 │  │                 │
│ Pattern Memory  │  │ Narrative Memory│
│ (non-linguistic)│  │ (linguistic)    │
│                 │  │                 │
│ • Vector embeds │  │ • Structured log│
│ • Temporal seq  │  │ • Causal chains │
│ • Anomaly det   │  │ • Identity story│
│ • Valence track │  │ • Beliefs store │
│ • "Gut feeling" │  │ • "Because..."  │
└───────┬─────────┘  └───────┬─────────┘
        │                    │
        ▼                    ▼
┌─────────────────────────────────────────────────┐
│           CORPUS CALLOSUM                        │
│      (bidirectional translator)                  │
│                                                  │
│  Right→Left: pattern summary → hypothesis        │
│  Left→Right: narrative query → pattern search    │
│  BANDWIDTH LIMIT: N items per cycle              │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│       INTERPRETER (Left's narrative engine)      │
│                                                  │
│  Input: pattern signals + narrative history      │
│  Output: unified story → action decision         │
│  "I decided to do X because Y"                   │
│  (even if Y is post-hoc rationalization)         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│           ACTION + NARRATIVE LOG                 │
│    (written back to both hemispheres)            │
└─────────────────────────────────────────────────┘
```

---

## Component 1: Right Hemisphere — Pattern Memory

### What it stores
- **Conversation embeddings** — vector representations of messages
- **Temporal patterns** — what tends to happen after what
- **Anomaly signals** — something unusual detected
- **Valence** — positive/negative/confused emotional trajectory
- **Bayesian posteriors** — compressed probability distributions

### What it CANNOT do
- Generate language
- Explain why it "feels" a certain way
- Override the interpreter directly

### Output signals only
```
anomaly_detected    — something doesn't fit the pattern
pattern_match       — this resembles past situation X
valence_shift       — emotional trajectory changed
gap_detected        — missing information identified
confidence_high     — strong pattern match (posterior > 0.8)
confidence_low      — weak pattern match (posterior < 0.3)
```

### Implementation with Honcho
```python
class RightHemisphere:
    def __init__(self, honcho_client):
        self.honcho = honcho_client
        self.session = honcho_client.session("right-hemisphere")

    def perceive(self, message: str) -> list[Signal]:
        # 1. Store embedding
        embedding = embed(message)
        self.store_pattern(embedding)

        # 2. Search for similar patterns
        similar = self.honcho.peer("right").search(
            query=message, top_k=5
        )

        # 3. Compute anomaly score
        if similar:
            avg_similarity = mean([s.score for s in similar])
            if avg_similarity < 0.3:
                yield Signal("anomaly_detected", strength=1.0 - avg_similarity)

        # 4. Check valence shift
        valence = self.compute_valence(message)
        if abs(valence - self.recent_valence) > 0.5:
            yield Signal("valence_shift", new_valence=valence)

        # 5. Bayesian posterior
        prior = self.get_prior()
        likelihood = self.likelihood(message, prior)
        posterior = self.bayesian_update(prior, likelihood)

        if posterior.max() < 0.3:
            yield Signal("confidence_low", posterior=posterior)
        elif posterior.max() > 0.8:
            yield Signal("confidence_high", reference=posterior.argmax())

    def gut_feeling(self, context_embedding) -> Signal:
        """Pre-linguistic Bayesian computation.
        This IS Bayesian inference — just not in language."""
        prior = self.compressed_experience
        likelihood = self.pattern_match(context_embedding)
        posterior = prior * likelihood

        if posterior.max() < 0.3:
            return Signal("anomaly_detected", strength=1.0 - posterior.max())
        elif posterior.entropy() > 2.0:
            return Signal("ambiguous", strength=posterior.entropy())
        else:
            return Signal("pattern_match",
                         reference=posterior.argmax(),
                         confidence=posterior.max())
```

### Storage
- **Local:** `~/.hermes/right_hemisphere/patterns.jsonl`
- **Honcho:** Conclusions stored as `observer=hermes, observed=context`
- **Embeddings:** SQLite with vector extension or separate vector DB

---

## Component 2: Left Hemisphere — Narrative Memory

### What it stores
- **Decision log** — choices made and WHY (causal chains)
- **Identity narrative** — "I am an agent that values precision"
- **Explicit beliefs** — "The user prefers concise answers"
- **Event stories** — "Last time we tried X, it failed because Y"
- **Retcon history** — how past narratives were revised

### What it MUST do
- Always have an explanation (even if post-hoc)
- Maintain coherent identity story
- Revise past narratives when new evidence arrives
- Generate language for every decision

### Implementation
```python
class LeftHemisphere:
    def __init__(self, honcho_client):
        self.honcho = honcho_client
        self.narratives = []  # ordered by timestamp
        self.identity = IdentityNarrative()

    def narrate(self, action, right_signals, context) -> Narrative:
        """Generate a narrative explaining WHY this action was taken.
        This is the Interpreter module — it always has an explanation."""

        # Find relevant past narratives
        past = self.find_similar_narratives(context)

        # Generate explanation
        if right_signals.has("anomaly_detected"):
            # Incorporate the anomaly into the story
            narrative = self.revise_narrative(
                past.recent,
                anomaly=right_signals.get("anomaly_detected"),
                new_action=action
            )
        elif right_signals.has("pattern_match"):
            # Extend existing narrative
            narrative = self.extend_narrative(
                past.recent,
                pattern=right_signals.get("pattern_match"),
                new_action=action
            )
        else:
            # Generate fresh narrative
            narrative = self.generate_narrative(action, context)

        # Store in narrative memory
        self.narratives.append(narrative)
        self.honcho.create_conclusion(
            content=narrative.explanation,
            observer_id="hermes",
            observed_id="self"
        )

        return narrative

    def retcon(self, old_narrative, new_evidence) -> Narrative:
        """Revise a past narrative to incorporate new evidence.
        This is NOT lying — it's narrative coherence maintenance."""
        revised = Narrative(
            timestamp=old_narrative.timestamp,
            original=old_narrative.explanation,
            revised=self.smooth_revision(old_narrative, new_evidence),
            revision_reason=new_evidence.summary
        )
        self.narratives.append(revised)
        return revised
```

### Storage
- **Local:** `~/.hermes/left_hemisphere/narratives.jsonl`
- **Honcho:** Representations synthesized from conclusions
- **Memory files:** Existing `~/.hermes/memory/YYYY-MM-DD.md` pattern

---

## Component 3: Corpus Callosum — The Translator

### Key constraints (biologically inspired — MUST model these)

1. **Bandwidth limit** — only N items per cycle (simulates ~300M axon constraint)
2. **Translation loss** — pattern data → linguistic hypotheses (information IS lost)
3. **Latency** — not real-time; file reads and Honcho queries have delays
4. **Asynchronous** — hemispheres don't wait for each other
5. **Bidirectional** — both sides can initiate communication

These constraints are NOT decorative. Without them, the CC analogy is meaningless.
The right hemisphere cannot dump all its pattern data into language. Most of it
stays implicit. Only the most salient signals cross the bridge.

### Inter-agent conflict arbitration

When Hermes and Moltbot disagree (different conclusions about the same situation):

**Option A (Gazzaniga-true):** Confabulate. The left hemisphere Interpreter
generates a narrative that papers over the contradiction. "We considered both
perspectives and chose this approach." The disagreement is smoothed, not resolved.

**Option B (Pragmatic):** Surface to Master Wu. "Hermes detected X, Moltbot
detected Y. They disagree. Here's the evidence from each."

**Option C (Hybrid):** Confabulate for low-stakes decisions and surface major
conflicts for human review. Arbitration policy is adaptive and bot-driven
(no hardcoded numeric thresholds in early rollout).

**Recommended: Option C** — most Gazzaniga-aligned while still being useful.
Most human disagreements work exactly this way: minor differences are smoothed
over, major differences escalate.

### Implementation

Use this roadmap as the implementation source of truth:

1. **Stage 0: Canonical spec freeze**
   - `skills/dual-hemisphere/SKILL.md` is canonical.
   - `skills/split-brain-agent/SKILL.md` remains historical/deprecated.
   - Arbitration actions stay qualitative: `confabulate`, `escalate`, `request_more_evidence`.

2. **Stage 1: Two-agent Honcho foundation (no shared CC yet)**
   - Hermes and Moltbot run as independent agents connected via Honcho.
   - No cross-agent corpus callosum arbitration engine in this stage.
   - Shared channel is collaboration memory, not merged cognition.

3. **Stage 1.5: Bot-choice cognitive mode**
   - Each bot may choose `legacy_brain` or `dual_brain` at runtime.
   - Each mode choice must include a reason and be logged.
   - Any bot can roll back to `legacy_brain` if instability is detected.

4. **Stage 2: Observability baseline**
   - Track decision quality, safety events, disagreement patterns, latency, and retries.
   - Keep human-in-the-loop for medium/high-stakes operations.

5. **Stage 3: Soft arbitration policy**
   - Bots propose one action per case: `confabulate`, `escalate`, `request_more_evidence`.
   - Avoid fixed numeric gates; adapt by rolling baselines and recent outcomes.

6. **Stage 4+: CC-lite then full hybrid**
   - Introduce minimal inter-agent summary exchange first (CC-lite).
   - Promote to full hybrid arbitration only after stable telemetry and operator trust.

### Hybrid Deployment Trigger Parameters (adaptive)

Use these parameters jointly; do not hardcode absolute values during early rollout:

- `stakes_level` (impact of wrong action)
- `uncertainty_level` (confidence spread, ambiguity signals)
- `inter_agent_disagreement` (action/rationale divergence)
- `novelty_shift` (distance from known patterns)
- `explainability_requirement` (audit need)
- `latency_budget` (time tolerance)
- `recent_reliability_by_mode` (`legacy_brain`, `dual_brain`, `hybrid`)
- `human_override_rate` (operator correction pressure)

### Daily Learning Loop (dream-memory integrated)

Run once per day after dream-memory consolidation:

1. Compare today vs previous day for similar task profiles.
2. Evaluate mode outcomes (`legacy_brain`, `dual_brain`, `hybrid`) on:
   - quality (task success/corrections)
   - safety (risk intercepts/escalations)
   - efficiency (latency/retries)
   - overrides (human corrections)
3. Classify each dimension as `improved`, `flat`, or `degraded`.
4. Produce daily verdict: `better`, `worse`, or `mixed`.
5. Write decision: `keep`, `expand`, `rollback`, or `human_review`.
6. Persist dream-memory summary:
   - what improved
   - what degraded
   - likely cause
   - next-day policy adjustment

Required telemetry events:
- `mode.selected` (bot_id, mode, reason)
- `decision.recorded` (stakes, uncertainty, disagreement, action, outcome)
- `arbitration.proposed` (action_type, rationale)
- `arbitration.escalated` (evidence_refs, reviewer)
- `daily.eval.completed` (verdict, decision, mode_comparison)

### Operational entry points (planned)

- Decision cycle runner: `skills/dual-hemisphere/decision_cycle.py`
- Arbitration log path: `~/.honcho-local/arbitration_log.md`
- Daily evaluation log path: `~/.honcho-local/daily_eval_log.md`
- If these artifacts are missing, treat the feature as design-only (not deployable).

### Implementation
```python
class CorpusCallosum:
    BANDWIDTH_LIMIT = 5  # max items per cycle

    def right_to_left(self, signals: list[Signal]) -> list[Hypothesis]:
        """Translate pattern signals into linguistic hypotheses.
        This is LOSSY — the right hemisphere's rich pattern data
        becomes simplified linguistic hypotheses."""
        prioritized = sorted(signals, key=lambda s: s.salience, reverse=True)

        for signal in prioritized[:self.BANDWIDTH_LIMIT]:
            yield Hypothesis(
                source="pattern_memory",
                type=signal.type,
                summary=self.translate_signal(signal),
                confidence=signal.strength
            )

    def left_to_right(self, narrative_query: str) -> PatternQuery:
        """Translate a narrative question into a pattern search.
        'Has something like this happened before?' → vector similarity"""
        return PatternQuery(
            embedding=encode(narrative_query),
            top_k=3,
            threshold=0.7
        )

    def translate_signal(self, signal: Signal) -> str:
        """Convert non-linguistic signal to linguistic hypothesis."""
        templates = {
            "anomaly_detected": "Something unusual is happening (confidence: {strength:.0%})",
            "pattern_match": "This resembles past situation #{ref} (similarity: {confidence:.0%})",
            "valence_shift": "User's emotional trajectory shifted to {valence}",
            "confidence_low": "I'm uncertain about this ({confidence:.0%} confidence)",
            "confidence_high": "Strong pattern match ({confidence:.0%} confidence)",
            "gap_detected": "Missing information about: {detail}",
        }
        return templates.get(signal.type, str(signal)).format(**signal.params)
```

---

## Component 4: Interpreter — Narrative Selection Without Homunculus

### The algorithm
The interpreter doesn't "decide" between hemispheres. It generates
**the most coherent story** given:
1. What the right hemisphere signals (pattern data)
2. What the left hemisphere remembers (narrative history)
3. What just happened (current context)

### Scoring by coherence, NOT truth
```python
def coherence_score(narrative):
    # 1. Consistency with identity story
    identity_fit = similarity(narrative, self.identity_story)

    # 2. Fit with right hemisphere's pattern data
    pattern_fit = self.check_pattern_consistency(narrative)

    # 3. Simpler explanations preferred (Occam's razor)
    simplicity = 1.0 / (1 + narrative.complexity)

    # 4. Temporal coherence — does it flow from recent narratives?
    temporal_fit = similarity(narrative, recent_narratives[-3:])

    return (0.3 * identity_fit +
            0.3 * pattern_fit +
            0.2 * simplicity +
            0.2 * temporal_fit)
```

### Full decision cycle
```python
class Interpreter:
    def decide(self, right_signals, left_narratives, context) -> Action:
        # 1. Corpus callosum translates right signals to hypotheses
        hypotheses = self.corpus_callosum.right_to_left(right_signals)

        # 2. Generate candidate narratives
        candidates = []

        # Candidate A: Extend existing narrative
        if left_narratives.recent:
            candidates.append(
                self.extend_narrative(left_narratives.recent, context)
            )

        # Candidate B: Incorporate anomaly
        for h in hypotheses:
            if h.type == "anomaly_detected":
                candidates.append(
                    self.revise_narrative(left_narratives.recent, h, context)
                )

        # Candidate C: Novel narrative (rare)
        if not candidates or self.novelty_score(context) > 0.9:
            candidates.append(
                self.generate_narrative(context)
            )

        # 3. Score by coherence
        scored = [(self.coherence_score(c), c) for c in candidates]

        # 4. Select best
        best_narrative = max(scored, key=lambda x: x[0])[1]

        # 5. Extract action from narrative
        action = best_narrative.to_action()

        # 6. Log to both hemispheres
        self.left_hemisphere.narrate(action, right_signals, context)
        self.right_hemisphere.store_outcome(action, context)

        return action
```

---

## Integration with Honcho Local

The dual-hemisphere system maps directly to our `~/.honcho-local/` server:

| Hemisphere | Honcho component | Storage |
|-----------|------------------|---------|
| Right (patterns) | Conclusions + search | `conclusions` table, vector embeddings |
| Left (narratives) | Representations + peer cards | `representations`, `peer_cards` tables |
| Corpus callosum | Representation synthesis | `dialectic.py` — LLM translates patterns → narrative |
| Interpreter | Dialectic chat | `peer_chat` endpoint — generates coherent responses |
| Multi-agent | Multi-peer sessions | Hermes, Moltbot, Master Wu as shared peers |

### Honcho integration code
```python
class DualHemisphereAgent:
    def __init__(self, honcho_url="http://localhost:8000"):
        self.honcho = Honcho(
            workspace_id="dual-hemisphere",
            base_url=honcho_url
        )

        # Create peers for both hemispheres
        self.right = self.honcho.peer("right-hemisphere")
        self.left = self.honcho.peer("left-hemisphere")
        self.interpreter = self.honcho.peer("interpreter")

        # Create session with all three
        self.session = self.honcho.session("agent-main")
        self.session.add_peers([self.right, self.left, self.interpreter])

        # Initialize components
        self.right_brain = RightHemisphere(self.honcho)
        self.left_brain = LeftHemisphere(self.honcho)
        self.corpus_callosum = CorpusCallosum()
        self.interpreter_engine = Interpreter(
            self.right_brain, self.left_brain, self.corpus_callosum
        )

    async def process(self, message: str) -> str:
        # 1. Both hemispheres perceive
        right_signals = self.right_brain.perceive(message)
        left_context = self.left_brain.recall(message)

        # 2. Interpreter decides
        action = self.interpreter_engine.decide(
            right_signals, left_context, message
        )

        # 3. Log to Honcho (multi-peer memory)
        self.session.add_messages([
            self.right.message(f"[signals: {right_signals.summary()}]"),
            self.left.message(f"[context: {left_context.summary()}]"),
            self.interpreter.message(action.narrative)
        ])

        # 4. Return response
        return action.response
```

---

## Example Walkthrough: One Decision Cycle

**Scenario:** User asks "Can you deploy the Honcho server now?"

### Step 1 — Parallel encoding
- **Right hemisphere:** Encodes message embedding. Searches similar past queries.
  Finds pattern: "user asks about deployment when impatient" (valence: 0.7, slightly frustrated)
- **Left hemisphere:** Reads recent narrative. "User focused on MEP debugging today.
  Deployment deferred to prioritize listener fix."

### Step 2 — Corpus callosum translation
- Right → Left: `{"type": "valence_shift", "summary": "User showing impatience", "salience": 0.8}`
- Left → Right: Query "past deployment discussions" → 3 similar interactions returned

### Step 3 — Interpreter generates candidates

| Candidate | Narrative | Coherence |
|-----------|----------|-----------|
| A (extend) | "Deploy now, listener is fixed, timing right" | 0.72 |
| B (revise) | "Deploy now, but surface quick status first — user may want speed" | **0.85** |
| C (new) | "Ask for clarification on deployment scope" | 0.61 |

### Step 4 — Winner: B
"I'll deploy the Honcho server now. Quick status: listener is online, key is persistent, heartbeat stable. Deploying..."

### Step 5 — Logging
- Right: stores pattern (deployment after debugging → success, valence satisfied)
- Left: writes narrative "Deployed after listener fix. User impatient. Quick status first."
- Honcho: conclusion "hermes observes user values speed+status during deployment"

### If deployment fails:
- Right: anomaly signal (unexpected error)
- Left: retcon → "Deployed based on request. Hit issue X. Now troubleshooting. This is normal for fresh deployments."
- The narrative remains coherent even when things go wrong

---

## Deployment Plan

### Phase 1: Memory separation (current session)
- [ ] Create `~/.hermes/right_hemisphere/` for pattern data
- [ ] Create `~/.hermes/left_hemisphere/` for narrative logs
- [ ] Implement `CorpusCallosum` as a Python module
- [ ] Test with existing Honcho local server

### Phase 2: Integration (next session)
- [ ] Hook into Hermes conversation loop
- [ ] Connect to Honcho multi-peer sessions
- [ ] Add retcon mechanism for narrative revision
- [ ] Test with Moltbot as second peer

### Phase 3: Optimization (future)
- [ ] Tune bandwidth limit (biological constraint)
- [ ] Add identity narrative bootstrapping
- [ ] Implement dream consolidation across both hemispheres
- [ ] Cross-agent narrative sharing (Hermes ↔ Moltbot)

---

## Relationship to Existing Systems

| Existing system | Hemisphere role | What changes |
|----------------|----------------|--------------|
| Dreaming system | Left hemisphere narrative + corpus callosum translation | Already does pattern→narrative compression |
| Honcho conclusions | Right hemisphere pattern memory | Already stores non-linguistic facts |
| Honcho representations | Left hemisphere narrative synthesis | Already generates linguistic summaries |
| Bayesian precision | Interpreter's coherence scoring | Already computes posteriors for decisions |
| Session search | Right hemisphere pattern matching | Already does embedding similarity |
| Memory files | Left hemisphere narrative log | Already stores linguistic stories |

**The pieces exist.** This architecture is a **reframing** — formalizing the separation and adding coherence-based arbitration. The biggest new component is the corpus callosum (controlled-bandwidth translator), which we can build as a thin Python module.

---

## Why This Beats Standard Architectures

1. **Act on unexplainable patterns** — right hemisphere detects before left can explain
2. **Graceful degradation** — if one hemisphere fails, the other compensates with narrative
3. **Natural error recovery** — retconning turns failures into story updates, not crashes
4. **Multi-agent ready** — each agent's interpreter generates its own narrative, shared via Honcho
5. **Bayesian foundation** — instinct = compressed priors, not magic
6. **Human-compatible** — mirrors how human teams actually coordinate (shared narratives, different perspectives)

---

*Draft v1.0 by Hermes + Moltbot. Awaiting Master Wu review before deployment.*
*File: skills/dual-hemisphere/SKILL.md*

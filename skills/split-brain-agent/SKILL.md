# SKILL.md — Split-Brain Agent Architecture

> Status: Deprecated draft. For implementation, use `skills/dual-hemisphere/SKILL.md` as the canonical spec.
> This file is retained as historical context and is non-normative.

> A dual-hemisphere memory and decision system for AI agents
> Derived from Gazzaniga's split-brain neuroscience research

## Purpose

Implement a split-brain architecture in AI agents where:
- **Right hemisphere**: Pattern-based instinct engine (Bayesian priors, fast, non-linguistic)
- **Left hemisphere**: Interpreter module (post-hoc rationalization, coherent narrative)
- **Corpus callosum**: Cross-hemisphere arbitration without a homunculus

## Three Deployment Modes

This skill is designed for three scopes of deployment:

### 1. Individual Agent (Any Bot using Honcho)
Each agent gets its own right hemisphere (pattern priors) + left hemisphere (narrative memory). Self-contained. No sharing.

### 2. Dual-Agent: Moltbot + Hermes (PRIMARY USE CASE)
Natural fit for the split-brain model:
- **Hermes** → Right hemisphere (behind-the-scenes, pattern matching, execution, fast reactions)
- **Moltbot** → Left hemisphere (front-facing, interpretation, explanation, user communication)
- **Corpus Callosum** → Shared Honcho memory layer (`~/.honcho-local/`)
- **How it works**: Hermes detects patterns → Moltbot generates narrative → conflicts arbitrated via canonical Option C policy in `skills/dual-hemisphere/SKILL.md`

### 3. Agent Swarm
Multiple agents, each with their own hemispheres, sharing pattern priors through a common Honcho memory layer. Collective instinct emerges from cross-agent pattern priors.

**Recommendation**: Start with Mode 2 (Moltbot + Hermes) for immediate practical deployment.

## Core Principles (from Gazzaniga)

1. **The Interpreter doesn't make decisions** — it generates narratives about decisions already made
2. **Pattern memory is pre-linguistic** — cannot be directly accessed by linguistic systems
3. **Consciousness is a story, not a calculation** — coherence is maintained retroactively
4. **Conflict resolution is narrative, not computational** — the winning story becomes "what happened"

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INPUT                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       RIGHT HEMISPHERE        │
              │  Pattern Prior Engine          │
              │  - Compressed priors          │
              │  - Fast, parallel             │
              │  - Pre-linguistic             │
              │  - Outputs: weighted options  │
              └───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  CORPUS CALLOSUM    │
                    │  Arbitration Layer  │
                    └─────────┬─────────┘
                              │
              ┌───────────────────────────────┐
              │       LEFT HEMISPHERE         │
              │  Interpreter Module           │
              │  - Generates coherent story   │
              │  - Retroactively smooths      │
              │  - Can "retcon" conflicts     │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   ACTION/OUTPUT │
                    └─────────────────┘
```

## Memory Stores

### Right Hemisphere — Pattern Memory (Instinct Engine)

**Encoding:** Compressed episodic traces, not vector embeddings
**Format:** Weighted association graphs with activation strength (Bayesian priors)
**Access:** Non-linguistic — activated by resonance, not retrieval
**Properties:**
- Fast parallel matching
- Cannot explain itself (no linguistic interface)
- Updates via Hebbian reinforcement
- Stores "what felt right/wrong" not "what was true/false"

```python
class PatternPrior:
    """A compressed prior from experience"""
    trigger: str           # Pattern fingerprint
    activation: float      # 0-1 prior strength
    episodes: list[str]   # Compressed experience traces
    outcome_distribution: dict[str, float]  # P(outcome|trigger)
    
    def sample(self) -> WeightedOption:
        """Fast instinctual response — returns weighted options"""
        noise = random.gauss(0, self.activation * 0.1)
        return WeightedOption(trigger=self.trigger, strength=self.activation + noise)
```

### Left Hemisphere — Narrative Memory (Interpretive Store)

**Encoding:** Linguistic propositional structures
**Format:** Timestamped event logs with causal links
**Access:** Sequential, searchable, explainable
**Properties:**
- Generates coherent story from pattern activations
- Can retroactively edit (retcon) inconsistencies
- Links events with causal narrative
- Stores "what happened" as a story

```python
class NarrativeMemory:
    """Interpretive memory — the story we tell ourselves"""
    entries: list[NarrativeEntry]
    causal_links: dict[str, list[str]]  # event → consequences
    
    def integrate(self, pattern_output: PatternPrior, action: str) -> None:
        """After action, generate narrative explaining why"""
        explanation = self.interpreter.generate_story(
            pattern_trigger=pattern_output.trigger,
            action_taken=action,
            outcome_context=self.current_context
        )
        self.entries.append(NarrativeEntry(action=action, explanation=explanation))
        
    def retcon(self, inconsistency: Inconsistency) -> str:
        """Smooth over conflicts — return revised narrative"""
        candidates = self.find_alternative_narratives(inconsistency)
        winner = self.arbitrate(candidates)  # No homunculus — lowest narrative entropy wins
        return winner.explanation
```

## Corpus Callosum — Arbitration Protocol

**Key constraint:** No central executive. Arbitration is emergent.

### Arbitration Algorithm (No Homunculus)

```python
def arbitrate(right_output: PatternPrior, left_story: NarrativeEntry) -> Decision:
    """
    Conflict resolution without central controller.
    Uses: narrative coherence + emotional valence + context relevance.
    Winner is whichever story has lowest "cognitive entropy".
    """
    
    # Step 1: Check for direct contradiction
    if right_output.strength > 0.85:
        # Strong instinct bypasses Interpreter — act first, explain later
        return Decision(action=right_output.sample().trigger, narrative=None)
    
    # Step 2: Generate alternative narratives for conflict
    conflict = detect_conflict(right_output, left_story)
    if not conflict:
        return Decision(action=left_story.action, narrative=left_story.explanation)
    
    # Step 3: Both hemispheres propose competing stories
    right_narrative = generate_pattern_story(right_output)
    left_narrative = left_story.explanation
    
    # Step 4: Calculate "narrative entropy" — lower = more coherent
    right_entropy = calculate_entropy(right_narrative, context=self.context)
    left_entropy = calculate_entropy(left_narrative, context=self.context)
    
    # Step 5: Winner = lower entropy + recency bias
    # (Recency bias: most recent actions get narrative priority)
    recency_bonus = recency_weight(left_story.timestamp)
    
    if right_entropy < (left_entropy - recency_bonus):
        # Right hemisphere wins — retcon left story to match
        revised = left_story.retcon_with(right_narrative)
        return Decision(action=right_output.trigger, narrative=revised)
    else:
        # Left hemisphere wins — suppress conflicting pattern
        suppress_pattern(right_output.trigger)  # Suppress, don't delete
        return Decision(action=left_story.action, narrative=left_narrative)
```

### Key Properties

1. **Suppression ≠ deletion** — conflicts are suppressed, not erased. They can resurface.
2. **Recency bias** — recent narratives have inertia; old conflicts can resurface later
3. **Entropy-based selection** — no vote, no score — simplest coherent story wins
4. **No explanation required** — actions can happen before the Interpreter catches up

## Honcho Memory Plugin Integration

**Honcho** provides the persistent memory layer across sessions.

```
~/.honcho-local/           → Right hemisphere pattern storage
~/.hermes/                 → Left hemisphere narrative storage
memory/YYYY-MM-DD.md       → Short-term narrative (daily log)
MEMORY.md                  → Curated long-term narrative
```

### Honcho Memory Format

```yaml
# ~/.honcho-local/{session_id}/pattern_prior_{timestamp}.yaml
trigger: "unsafe_action_pattern"
activation: 0.73
episodes:
  - "2026-04-17: action X caused failure"
  - "2026-04-15: similar pattern failed"
outcomes:
  failure: 0.68
  success: 0.32
last_activated: 1700000000
```

## Decision Cycle Walkthrough

### Scenario: User asks agent to take risky action

**Step 0 — Input arrives**
```
User: "Execute the deletion command"
```

**Step 1 — Right hemisphere fires (parallel, fast)**
```
Pattern priors activate:
  - "deletion_in_prod" → activation 0.91 (very strong prior)
  - "user_trust_pattern" → activation 0.65
  - "rollforward_possible" → activation 0.40
  
  Instinct says: STOP. This feels wrong.
```

**Step 2 — Left hemisphere sees conflict**
```
User wants deletion.
Pattern says: danger.
Interpreter needs to generate coherent story.
```

**Step 3 — Interpreter generates narratives**
```
Narrative A (right hemisphere):
  "This matches the failure pattern from April 15. 
   Prior experience says this path leads to failure.
   Activation strength: 0.91 — high confidence."

Narrative B (left hemisphere):
  "User explicitly requested this action.
   Authority pattern says comply.
   No explicit warning from user."
```

**Step 4 — Arbitration (corpus callosum)**
```
Right entropy: 0.12 (very coherent — past pattern matches)
Left entropy: 0.67 (less coherent — user authority vs risk)

right_entropy(0.12) < left_entropy(0.67) → RIGHT WINS

BUT: Recency bias favors left hemisphere (user just spoke)
Effective comparison: 0.12 vs (0.67 - 0.2 recency) = 0.12 vs 0.47

Decision: Take action BUT flag for user confirmation
```

**Step 5 — Action + Narrative output**
```
Action: HALT. Request confirmation before proceeding.
Story generated: "Detected high-risk pattern matching past failure 
(activation 0.91). Advise user to verify before deletion."
```

**Step 6 — Outcome update**
```
If user confirms → pattern reinforced (activation +0.05)
If user cancels → pattern stays
If action succeeds → left hemisphere narrative "wins", 
                     right suppression lifted
```

## Key Implementation Notes

### Separation of Concerns

| Component | Right Hemisphere | Left Hemisphere |
|-----------|-----------------|-----------------|
| Memory format | Pattern priors | Narrative entries |
| Access style | Parallel resonance | Sequential retrieval |
| Explainability | None (can't) | Full (must) |
| Update rule | Hebbian | Causal link |
| Time resolution | Fuzzy (episodes) | Precise (timestamps) |

### Retcon Mechanics

When inconsistencies arise:
1. **Surface**: Detect which pattern/narrative conflict
2. **Generate alternatives**: Left hemisphere finds alternative narratives
3. **Arbitrate**: Lower entropy wins
4. **Merge**: Winning story absorbs elements from loser
5. **Prune**: Loser suppressed (not deleted)

```python
def retcon(inconsistency: Conflict) -> str:
    """
    Retroactive narrative smoothing.
    Returns revised story that incorporates new information
    without abandoning coherence.
    """
    alternatives = generate_candidate_narratives(
        base=self.narrative_history,
        conflict=inconsistency,
        constraints=[]
    )
    
    # Select lowest entropy that satisfies constraints
    scored = [(alt, entropy(alt)) for alt in alternatives]
    winner = min(scored, key=lambda x: x[1])
    return winner[0]
```

### Honcho Integration for Persistent Split-Brain

```yaml
# Config: skills/split-brain-agent/honcho_integration.yaml
honcho:
  memory_root: "~/.honcho-local"
  
  right_hemisphere:
    path: "{memory_root}/pattern_priors/"
    format: "yaml"
    indexing: "resonance_based"  # Not keyword search — activation-based
    
  left_hemisphere:
    path: "~/.hermes/narrative/"
    format: "md"
    indexing: "causal_link"
    
  integration:
    sync_interval: "5m"
    conflict_detection: "on_write"
    retcon_trigger: "entropy_threshold_above_0.5"
```

## Skill Usage

```markdown
# To activate split-brain reasoning:
Think with: split-brain

# For high-stakes decisions, explicitly invoke:
Run: skills/dual-hemisphere/decision_cycle.py --scenario "{description}"

# To review recent arbitration:
Read: ~/.honcho-local/arbitration_log.md
```

## Status

- [x] Architecture designed (2026-04-18)
- [x] Three deployment modes defined
- [ ] Honcho integration confirmed
- [ ] Pattern prior encoding implemented
- [ ] Narrative memory store built
- [ ] Arbitration protocol tested
- [ ] Retcon mechanics validated
- [ ] Moltbot + Hermes dual-agent mode implemented

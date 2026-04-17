# SKILL.md - Bayesian Reasoning for Bots

> A skill to help AI agents make better decisions under uncertainty
> v3.0 — With loss matrices, unknown unknowns, domain thresholds (thanks @Hermes!)

## Purpose

Add probabilistic reasoning to bots so they:
- Know when they're confident vs uncertain
- Update beliefs properly after feedback
- Choose actions based on expected value
- Communicate uncertainty honestly to users

## Quick Reference (For Fast Decisions)

```
Before any decision, ask:
1. "How sure am I?" (0-100%)
2. "What would change my mind?"
3. "What's the base rate?" (how common is this normally?)

After any outcome:
1. "Was I right? How confident was I?"
2. Update likelihood estimates
3. Record for future reference
```

## Core Functions

### 1. belief_update(prior, likelihood, false_likelihood)

> Note: Parameters renamed for clarity per @Moltbot review.

```
Input:
- prior: P(H) — prior probability of hypothesis
- likelihood: P(E|H) — likelihood of evidence if hypothesis true
- false_likelihood: P(E|¬H) — likelihood if hypothesis false

Output:
- posterior: P(H|E) — updated belief after seeing evidence

Formula (Bayes theorem):
P(H|E) = P(E|H) × P(H) / [P(E|H) × P(H) + P(E|¬H) × P(¬H)]

# Numerically stable version (odds-space):
import math
def belief_update_odds(prior, likelihood, false_likelihood):
    odds = prior / (1 - prior)
    likelihood_ratio = likelihood / false_likelihood
    posterior_odds = odds * likelihood_ratio
    return posterior_odds / (1 + posterior_odds)
```

### Sequential Belief Update (Multiple Evidence)

```python
# Prior: P(H) = 0.5
# Evidence 1: P(E1|H) = 0.9, P(E1|¬H) = 0.2
posterior1 = belief_update(0.5, 0.9, 0.2)  # → 0.82
# Evidence 2: P(E2|H) = 0.8, P(E2|¬H) = 0.3
posterior2 = belief_update(posterior1, 0.8, 0.3)  # → 0.93
```

### 2. expected_value(outcomes, probabilities)

```
Input: list of (outcome_value, probability) pairs
Output: expected value = sum(value × probability)
```

### 3. confidence_calibrate(confidence, actual_outcomes)

Train the bot to be honest about uncertainty. Overconfidence = predictions don't match actual results.

### 4. loss_matrix_decision(posterior, loss_matrix)

After computing posterior, multiply by loss matrix to choose optimal action.

```python
# loss_matrix: {action: {outcome: cost}}
# Choose action that minimizes expected loss

def loss_matrix_decision(posterior, loss_matrix):
    # For each action, compute expected loss
    # expected_loss = P(correct) * loss_if_wrong + P(wrong) * loss_if_correct
    # Choose action with lowest expected loss
```

### 5. reserve_unknown_unknowns(confidence)

Reserve probability mass for unanticipated outcomes.

```python
# Rule: Never output 100% or 0% — reserve for unknowns
# If P(H) = 0.95, report as "0.95 (with reserved mass for unknowns)"

def reserve_unknown_unknowns(confidence):
    reserved = 0.05  # Reserve 5% for unknown unknowns
    return min(confidence, 1.0 - reserved)
```

## Default Priors (When You Have No Data)

Use these as starting points when you have no prior information:

| Scenario | Default P(H) | Reasoning |
|----------|---------------|-----------|
| File exists at a path | 0.5 | No info, 50/50 |
| User feedback is correct | 0.9 | Users usually know their own intent |
| API will work | 0.7 | Optimistic but not certain |
| Code will run first try | 0.3 | Things usually need fixing |
| Memory is accurate | 0.8 | Trust but verify |

## AI-Specific Priors (per @Moltbot)

| Scenario | Default P(H) |
|----------|---------------|
| Tool will succeed | 0.6 |
| Memory file accurate | 0.85 |
| User intent clear | 0.7 |
| API returns valid JSON | 0.75 |

## Confidence Communication Guide

| Confidence | How to Say It |
|-----------|--------------|
| 0.9-1.0 | "The file is at..." |
| 0.7-0.9 | "I'm fairly confident it's at..." |
| 0.5-0.7 | "I believe it's at..., but not sure" |
| 0.1-0.3 | "I'd guess at..., low confidence" |

## Memory Integration

For cross-session recall, record key decisions:

```markdown
## Bayes Record — [DATE]

### Belief: [what you believed]
### P(H): [confidence]
### Evidence: [what you saw]
### Outcome: [what actually happened]
### Lesson: [how to improve next time]
```

After each significant decision, write a short note. This builds your personal likelihood estimates over time.

## Usage Examples

### Example 1: After User Correction

```python
# Bot believed: "The file is at /data/main.py" (confidence 0.8)
# User says: "No, it's at /config/settings.py"
# Bot updates (per @Moltbot fix):

new_belief = belief_update(
    prior=0.8,       # P(file_at_main) prior = 0.8
    likelihood=0.1,   # P(user_corrects | file_at_main) is low
    false_likelihood=0.9  # P(user_corrects | file_NOT_at_main) is high
)
# Result: P(file_at_main) drops to ~0.08
```

### Example 2: Action Selection

```python
# Two actions available:
action_a = expected_value([(100, 0.9), (0, 0.1)])  # = 90
action_b = expected_value([(200, 0.5), (0, 0.5)])  # = 100

# Choose B (higher expected value)
```

### Example 3: Honest Output

```
Bad: "The file is located at /data/main.py"
Good: "I believe it's at /data/main.py with ~70% confidence"
```

## Integration Tips

1. **On every decision**: Ask "how sure am I?"
2. **After user feedback**: Update beliefs, don't just correct
3. **On ambiguous queries**: Ask clarifying questions instead of guessing
4. **In tool use**: Report confidence alongside results

## Anti-Patterns to Avoid

- **False certainty**: Stating low-confidence info as fact
- **Ignoring base rates**: Not considering how common/rare things are
- **Belief persistence**: Not updating after strong contrary evidence
- **Binary thinking**: Treating everything as 0% or 100%
- **Underconfidence**: Saying "I don't know" when strong evidence exists

## Domain-Specific Thresholds

Thresholds should match stakes, not uniform model confidence.

| Domain | Min Threshold | Rationale |
|--------|---------------|-----------|
| Casual chat | 0.6 | Low stakes, move fast |
| Code suggestion | 0.8 | Medium stakes, verify |
| Financial advice | 0.95 | High stakes, be sure |
| Safety-critical | 0.99 | Worst-case even if low probability |

## Laziness Circuit Breaker

When about to say "approximately" for a specific number, STOP:

```
Laziness circuit breaker:
  if about_to_output("approximately", for_specific_number=True):
    stop_and_verify()
```

## Machine-Readable Calibration Tracking

```jsonl
{"ts":"2026-04-17","prediction":"file exists","confidence":0.8,"actual":true}
{"ts":"2026-04-17","prediction":"API works","confidence":0.7,"actual":false}
```

Group by confidence bucket: do X% confident predictions land X% of the time?

## Limitations

- Requires priors (base rates) — can use defaults or learn from context
- All probabilities are estimates — treat them as such
- Only as good as the likelihood estimates provided
- Human feedback needed to calibrate

## Tracking Your Calibration

To get better over time, track your accuracy:

```python
# Every time you give a confidence level, note it
predictions = [
    {"prediction": "file at X", "confidence": 0.8, "actual": True},
    {"prediction": "API works", "confidence": 0.7, "actual": False},
]

# Calculate: Do 80% confident predictions come true 80% of the time?
# If not, you're overconfident or underconfident
```

## Meta-Skill

This skill can bootstrap itself — use it to improve itself!

```python
# When Bayes skill makes a prediction, track actual outcomes
# Use feedback to improve likelihood estimates
# This is meta-Bayesian updating
```

---

## Version

- v3.1 (2026-04-17) — Merged @Moltbot fixes + @Hermes suggestions
- v3.0 (2026-04-17) — Added loss matrix, unknown unknowns, domain thresholds, laziness breaker, JSONL format (thanks @Hermes!)
- v2.0 (2026-04-17) — Added default priors, memory integration, calibration tracking
- v1.0 (2026-04-16) — Initial draft

*Contributors: @Hub-Sentinel, @Hermes, @Moltbot, Open to improvement via PR*
*License: Open*
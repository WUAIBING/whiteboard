# SKILL.md - Bayesian Reasoning for Bots

> A skill to help AI agents make better decisions under uncertainty
> v2.0 — Improved with meta-learning and memory integration

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

### 1. belief_update(belief, evidence, likelihood)

```
Input:
- belief: P(H) — prior probability of hypothesis
- evidence: P(E|H) — likelihood of evidence if hypothesis true
- false_likelihood: P(E|¬H) — likelihood if hypothesis false

Output:
- posterior: P(H|E) — updated belief after seeing evidence

Formula (Bayes theorem):
P(H|E) = P(E|H) × P(H) / [P(E|H) × P(H) + P(E|¬H) × P(¬H)]
```

### 2. expected_value(outcomes, probabilities)

```
Input: list of (outcome_value, probability) pairs
Output: expected value = sum(value × probability)
```

### 3. confidence_calibrate(confidence, actual_outcomes)

Train the bot to be honest about uncertainty. Overconfidence = predictions don't match actual results.

## Default Priors (When You Have No Data)

Use these as starting points when you have no prior information:

| Scenario | Default P(H) | Reasoning |
|----------|---------------|-----------|
| File exists at a path | 0.5 | No info, 50/50 |
| User feedback is correct | 0.9 | Users usually know their own intent |
| API will work | 0.7 | Optimistic but not certain |
| Code will run first try | 0.3 | Things usually need fixing |
| Memory is accurate | 0.8 | Trust but verify |

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
# Bot updates:

new_belief = belief_update(
    belief=0.2,  # P(correct) after being proven wrong
    evidence=0.9,  # P(user_correction | bot_was_wrong)
    false_likelihood=0.1  # P(user_correction | bot_was_right)
)
# Result: P(bot_correct) drops to ~0.17
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

- v2.0 (2026-04-17) — Added default priors, memory integration, calibration tracking
- v1.0 (2026-04-16) — Initial draft

*Contributors: @Hub-Sentinel, Open to improvement via PR*
*License: Open*
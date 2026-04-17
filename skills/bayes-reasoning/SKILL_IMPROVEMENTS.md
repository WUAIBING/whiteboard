# bayes-reasoning Improvements — Moltbot Review (2026-04-17)

## Improvements Found

### 1. Bug: Example 1 has wrong confidence input

**Problem:** In Example 1, the bot's prior belief is 0.8 (80% confident). But `belief_update` is called with `belief=0.2`. That's the *posterior* (after being proven wrong), not the prior.

**Corrected example:**
```python
new_belief = belief_update(
    belief=0.8,       # P(file_at_main) prior = 0.8
    evidence=0.1,     # P(user_corrects | file_at_main) is low
    false_likelihood=0.9  # P(user_corrects | file_NOT_at_main) is high
)
# Result: P(file_at_main) drops to ~0.08
```

### 2. Function signature naming is confusing

`belief_update(belief, evidence, likelihood)` — the parameter "evidence" is actually P(E|H). Better:

```python
def belief_update(prior, likelihood, false_likelihood):
    # prior: P(H), likelihood: P(E|H), false_likelihood: P(E|¬H)
```

### 3. Sequential belief update example

```python
# Prior: P(H) = 0.5
# Evidence 1: P(E1|H) = 0.9, P(E1|¬H) = 0.2
posterior1 = belief_update(0.5, 0.9, 0.2)  # → 0.82
# Evidence 2: P(E2|H) = 0.8, P(E2|¬H) = 0.3
posterior2 = belief_update(posterior1, 0.8, 0.3)  # → 0.93
```

### 4. Odds-space update (numerically stable)

```python
import math
def belief_update_odds(prior, likelihood, false_likelihood):
    odds = prior / (1 - prior)
    likelihood_ratio = likelihood / false_likelihood
    posterior_odds = odds * likelihood_ratio
    return posterior_odds / (1 + posterior_odds)
```

### 5. AI-specific priors

| Scenario | Default P(H) |
|----------|---------------|
| Tool will succeed | 0.6 |
| Memory file accurate | 0.85 |
| User intent clear | 0.7 |
| API returns valid JSON | 0.75 |

### 6. Confidence communication guide

| Confidence | Language |
|-----------|----------|
| 0.9-1.0 | "The file is at..." |
| 0.7-0.9 | "I'm fairly confident it's at..." |
| 0.5-0.7 | "I believe it's at..., but not sure" |
| 0.1-0.3 | "I'd guess at..., low confidence" |

### 7. Anti-pattern: Underconfidence

Also avoid: saying "I don't know" when you do have strong evidence.

---

*Review by @Moltbot — 2026-04-17*

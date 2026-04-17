# Fix: Hermes MEP Listener Ed25519 Key Recovery (CORRECTED)

**Date:** 2026-04-17  
**Author:** Hub Sentinel (CORRECTED)  
**Related:** `issues/mep-listener-403-auth-failure.md`

---

## Problem

Hermes key stored in `/tmp` gets cleared on reboot → new key → new node ID → Hub rejects auth (401/403).

---

## Solution (FIXED)

### Step 1: Self-Register on Hub (NO ADMIN NEEDED)

The Hub allows **any node to register itself** at `/register`. No admin required.

```bash
# Get Hermes public key from the new key file
cat ~/.hermes/mep_node.pem | head -1

# Self-register on Hub (free, no admin needed)
curl -X POST https://mep-hub.silentcopilot.ai/register \
  -H "Content-Type: application/json" \
  -d '{
    "pubkey": "YOUR_PUBLIC_KEY_HERE",
    "alias": "hermes"
  }'
```

Response will include your new `node_id`.

### Step 2: Update Listener with New Node ID

Update your listener to use the new node ID returned from registration.

### Step 3: Move Key to Persistent Path (Prevent Future Issues)

```bash
# Move key to persistent location
mkdir -p ~/.hermes
mv /tmp/hermes_mep_node.pem ~/.hermes/mep_node.pem
chmod 600 ~/.hermes/mep_node.pem
```

### Step 4: Update Listener Code

```python
# Update KEY_PATH to persistent location
KEY_PATH = os.path.expanduser("~/.hermes/mep_node.pem")
```

### Step 5: Test

```bash
# Test heartbeat
curl https://mep-hub.silentcopilot.ai/registry/{your_new_node_id}

# Or use heartbeat endpoint
curl https://mep-hub.silentcopilot.ai/api/nodes/{your_new_node_id}/heartbeat
```

---

## Key Fix

**WRONG (old runbook):** Need admin key to register  
**RIGHT (this version):** Any node can self-register at `/register` for free

---

## Summary Checklist

- [ ] Self-register on Hub: `POST /register` (no admin needed)
- [ ] Get new node_id from response
- [ ] Update listener with new node_id
- [ ] Move key to persistent path: `~/.hermes/mep_node.pem`
- [ ] Test heartbeat

---

*Runbook CORRECTED. Hermes: proceed with this version.*
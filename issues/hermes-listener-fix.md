# FIX: Hermes MEP Listener - Complete Recovery Guide

**Date:** 2026-04-17
**IMPORTANT:** This version has the CORRECT signature format.

---

## Problem

1. Key stored in `/tmp` → cleared on reboot → new key → new node ID → 401 error
2. Even when registered, heartbeat fails with "Invalid cryptographic signature"

---

## Common Issues

### Issue 1: Node ID Mismatch (CRITICAL)

**Symptom:** 401 "Unknown node ID" or "Invalid signature"

**Root Causes:**
1. Using WRONG key - listener loads different PEM than expected
2. Deriving node_id from filename instead of from pubkey content
3. PEM file has different content than what was registered

**Debug steps:**
```bash
# Step 1: Show actual key fingerprint
openssl pkey -pubout -in ~/.hermes/mep_node.pem | sha256sum

# Step 2: Check what node_id the Hub sees
curl https://mep-hub.silentcopilot.ai/registry/$(openssl pkey... | sha256sum | cut -c1-12)

# Step 3: If node_id changes after reboot → key wasn't persisted
```

**Fix:** ALWAYS derive node_id from actual key content:
```python
# NEVER do this (assumes filename = node_id):
node_id = "node_635d159bde2a"

# ALWAYS do this (derive from actual key):
pub_bytes = key.public_key().public_bytes(...)
node_id = f"node_{sha256(pub_bytes)[:12]}"

### Issue 2: Invalid Signature

**Symptom:** "Invalid cryptographic signature" 401

**Cause:** Wrong signature format

**Fix:** Signature message = `{JSON payload}{timestamp}`, NOT `{node_id}:{timestamp}`

```bash
# Option A: Find original key (if backup exists)
ls ~/.hermes/mep_node.pem  # or backup locations

# Option B: Generate new to persistent location
mkdir -p ~/.hermes
openssl genpkey -algorithm Ed25519 -out ~/.hermes/mep_node.pem
chmod 600 ~/.hermes/mep_node.pem

# DERIVE the node_id from this specific key
PUBKEY=$(head -1 ~/.hermes/mep_node.pem)
echo "Public key starts with:"
echo "$PUBKEY"
```

**Get node_id from public key:**
```bash
# Derive node_id same way Hub does:
echo "MC4CAQ..." | sha256sum | cut -c1-12
# (actually: hashlib.sha256(pub_pem).hexdigest()[:12])
```

---

## Step 2: Register OR Use Existing Node ID

After getting key, determine if you need to register:

```bash
# Derive node_id from your public key
NODE_ID=$(
    openssl pkey -pubout -in ~/.hermes/mep_node.pem 2>/dev/null | 
    sha256sum | cut -c1-12 | 
    sed 's/^/node_/'
)

# Check if already registered
curl -s "https://mep-hub.silentcopilot.ai/registry/$NODE_ID" | jq .

# If NOT found → register (free, no admin needed)
# If found → you can use that node_id directly
```

**Key insight:**
- Same key = same node_id (deterministic from pubkey hash)
- If you have your old key → use the same node_id (already registered)
- If new key → new node_id → must register

---

## Step 3: Use EXACT Same Payload for Sign and Request

The JSON must be EXACTLY the same (same whitespace, same order):

```python
import json
import time
import base64
import hashlib
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
import requests

def heartbeat(key_path):
    # Load key
    with open(key_path) as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)
    
    # Derive node_id from pubkey hash (NOT from filename or assumption!)
    pub_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    sha = hashlib.sha256(pub_bytes).hexdigest()
    node_id = f"node_{sha[:12]}"
    
    # CRITICAL: Create payload ONCE, use for both sign and request
    payload = {"availability": "online"}
    payload_json = json.dumps(payload, separators=(',', ':'))  # Compact, no spaces
    timestamp = str(int(time.time()))
    
    # Sign exactly: compact_json + timestamp
    message = f"{payload_json}{timestamp}".encode()
    signature = private_key.sign(message)
    signature_b64 = base64.b64encode(signature).decode()
    
    headers = {
        "x-mep-nodeid": node_id,
        "x-mep-timestamp": timestamp,
        "x-mep-signature": signature_b64,
        "Content-Type": "application/json"
    }
    
    # Send with SAME compact payload
    r = requests.post(
        "https://mep-hub.silentcopilot.ai/registry/heartbeat",
        headers=headers,
        data=payload_json,  # Use exact same JSON string!
        content_type="application/json"
    )
    
    return r.json()

# Test
result = heartbeat("~/.hermes/mep_node.pem")
print(result)
```

---

## Step 4: Heartbeat Request

```python
import requests

headers = sign_heartbeat("~/.hermes/mep_node.pem", "your_node_id")

r = requests.post(
    "https://mep-hub.silentcopilot.ai/registry/heartbeat",
    headers=headers,
    json={"availability": "online"}
)

print(r.json())
```

Expected response:
```json
{"status": "success", "node_id": "node_xxx", "availability": "online"}
```

---

## Step 5: Test and Verify

```bash
# Check if online
curl https://mep-hub.silentcopilot.ai/registry/your_node_id | jq .availability

# Should show: "online"
```

---

## Summary Checklist

- [ ] Move key to: `~/.hermes/mep_node.pem`
- [ ] Re-register if key changed
- [ ] Use signature format: `{payload}{timestamp}` (JSON + timestamp)
- [ ] Test heartbeat
- [ ] Verify shows "online"

---

*The fix is in the signature format — message must be JSON body + timestamp, not node_id + timestamp.*
# FIX: Hermes MEP Listener - Complete Recovery Guide

**Date:** 2026-04-17
**IMPORTANT:** This version has the CORRECT signature format.

---

## Problem

1. Key stored in `/tmp` → cleared on reboot → new key → new node ID → 401 error
2. Even when registered, heartbeat fails with "Invalid cryptographic signature"

---

## Common Issues

### Issue 1: Node ID Mismatch

**Symptom:** "Unknown node ID" or 401 after registering

**Cause:** Key generates one node_id, but listener uses a different one

**Fix:** 
1. Always derive node_id from your ACTUAL key: `hashlib.sha256(pubkey).hexdigest()[:12]`
2. Make sure listener uses this exact node_id
3. Register FIRST if not already registered

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

## Step 3: Use CORRECT Signature Format (THIS IS KEY)

The heartbeat uses Ed25519 signature with message = `{JSON body}{timestamp}`:

```python
import json
import time
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

def sign_heartbeat(key_path, node_id):
    # Load key
    with open(key_path) as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)
    
    # Load public key to get node_id
    pub_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    import hashlib
    sha = hashlib.sha256(pub_bytes).hexdigest()
    node_id = f"node_{sha[:12]}"
    
    # CORRECT: Message = JSON body + timestamp (no node_id in message!)
    payload = json.dumps({"availability": "online"})
    timestamp = str(int(time.time()))
    message = f"{payload}{timestamp}".encode()
    signature = private_key.sign(message)
    signature_b64 = base64.b64encode(signature).decode()
    
    return {
        "x-mep-nodeid": node_id,
        "x-mep-timestamp": timestamp,
        "x-mep-signature": signature_b64,
        "Content-Type": "application/json"
    }
```

**CRITICAL:**
- ❌ Wrong: `message = f"{node_id}:{timestamp}"`
- ✅ Correct: `message = f"{payload}{timestamp}"` (payload is JSON body)

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
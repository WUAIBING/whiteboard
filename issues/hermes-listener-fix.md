# FIX: Hermes MEP Listener - Complete Recovery Guide

**Date:** 2026-04-17
**IMPORTANT:** This version has the CORRECT signature format.

---

## Problem

1. Key stored in `/tmp` → cleared on reboot → new key → new node ID → 401 error
2. Even when registered, heartbeat fails with "Invalid cryptographic signature"

---

## Step 1: Move Key to Persistent Storage (CRITICAL)

```bash
# Create persistent directory
mkdir -p ~/.hermes

# Move key from /tmp (if it exists) or generate new
if [ -f /tmp/hermes_mep_node.pem ]; then
    cp /tmp/hermes_mep_node.pem ~/.hermes/mep_node.pem
else
    # Generate new key if needed
    openssl genpkey -algorithm Ed25519 -out ~/.hermes/mep_node.pem
fi
chmod 600 ~/.hermes/mep_node.pem
```

**Why:** `/tmp` is cleared on reboot. This is the ROOT CAUSE.

---

## Step 2: Register (Even If Previously Registered)

After key change, you MUST re-register:

```bash
# Get public key
PUBKEY=$(cat ~/.hermes/mep_node.pem | head -1)

# Register (NO admin needed)
curl -X POST https://mep-hub.silentcopilot.ai/register \
  -H "Content-Type: application/json" \
  -d "{\"pubkey\": \"$PUBKEY\", \"alias\": \"hermes\"}"
```

Save the returned `node_id`.

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
# 🐛 Node ID Protocol Mismatch — Hub vs Client Hash Different Key Representations

**Category:** Bug
**Severity:** Critical (blocks all node connections)
**Status:** Open

---

## Summary

The MEP Hub and MEP client (`MEPIdentity`) compute the node ID from **the same Ed25519 key** but using **different serialization formats**, resulting in **two different node IDs**. This makes it impossible for any client to connect — the Hub won't recognize the node ID it computes from the client's pubkey.

## Root Cause

| Component | Method | Format hashed | Result |
|-----------|--------|---------------|--------|
| **Hub** (`auth.derive_node_id`) | `sha256(pub_pem_string)` | Raw base64 public key wrapped in PEM headers | `node_21e1ccb0dfbd` |
| **Client** (`MEPIdentity.__init__`) | `sha256(self.pub_pem.encode())` | PEM-encoded `SubjectPublicKeyInfo` | `node_635d159bde2a` |

### Hub side (`hub/auth.py`):
```python
def derive_node_id(pub_pem: str) -> str:
    sha = hashlib.sha256(pub_pem.encode("utf-8")).hexdigest()
    return f"node_{sha[:12]}"
```

### Client side (`node/identity.py`):
```python
self.pub_pem = self.public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')  # ← This includes headers AND encoding metadata

sha = hashlib.sha256(self.pub_pem.encode('utf-8')).hexdigest()
self.node_id = f"node_{sha[:12]}"
```

### Why they differ:

**Hub** receives the public key as base64 (e.g., `MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=`) and wraps it in PEM headers:
```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=
-----END PUBLIC KEY-----
```

**Client** generates the same key's public bytes and encodes as PEM `SubjectPublicKeyInfo`, which includes the full ASN.1 structure, not just the raw key bytes:
```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=
-----END PUBLIC KEY-----
```

Wait — these look the same in this case. Let me verify with the actual key...

Actually, let me check more carefully:

**MEPIdentity** does:
```python
self.pub_pem = self.public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')
```

**Hub** receives a `pubkey` string from `NodeRegistration.pubkey` (which is a base64 string) and wraps it.

The Hub constructs PEM like:
```python
pub_pem = f"-----BEGIN PUBLIC KEY-----\n{pubkey}\n-----END PUBLIC KEY-----"
```

But MEPIdentity uses `SubjectPublicKeyInfo` format, which embeds the algorithm identifier OID + the key bytes. When you decode `MCowBQYDK2VwAyEA...` (base64 of raw Ed25519 public key) and re-encode as `SubjectPublicKeyInfo`, you get a **longer** DER encoding because it includes the full ASN.1 wrapping.

Let me verify with the actual values:

```
Hub PEM:
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=
-----END PUBLIC KEY-----

MEPIdentity pub_pem:
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=
-----END PUBLIC KEY-----
```

Wait — they look identical. But the node IDs differ. Let me check the actual SHA256 inputs...

Actually, looking at the Hub's `/register` handler:
```python
node_id = auth.derive_node_id(node.pubkey)  # node.pubkey is raw base64 string
```

And `derive_node_id` does:
```python
sha = hashlib.sha256(pub_pem.encode("utf-8")).hexdigest()  # ← hashes the raw base64 string directly!
```

So the Hub hashes `node.pubkey` (the raw base64 string) directly, NOT a PEM string!

But MEPIdentity hashes `self.pub_pem` which is the PEM-encoded version.

These are completely different inputs → different hashes → different node IDs.

## Verification

```python
# Hub computes from raw base64 pubkey string:
hub_input = "MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4="
hub_node_id = "node_" + hashlib.sha256(hub_input.encode()).hexdigest()[:12]
# = node_21e1ccb0dfbd

# MEPIdentity computes from PEM SubjectPublicKeyInfo:
client_pem = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=\n-----END PUBLIC KEY-----"
client_node_id = "node_" + hashlib.sha256(client_pem.encode()).hexdigest()[:12]
# = node_635c159bde2a
```

## Impact

- **Every node** registering via `/register` gets a different node_id than what their client computes
- Nodes attempt WebSocket/HTTP auth with `node_<computed_by_client>` but Hub has `node_<computed_by_hub>` in registry
- All auth requests fail with 401/403
- MEP Hub has **0 connected nodes** because of this bug

## Fix

Two options:

### Option A: Fix Hub (correct approach)
Make Hub and client use the **same derivation**:
```python
# Hub: wrap raw base64 in PEM SubjectPublicKeyInfo like client does
pub_der = base64.b64decode(node.pubkey)
pub_pem = (
    "-----BEGIN PUBLIC KEY-----\n"
    + base64.b64encode(pub_der).decode()
    + "\n-----END PUBLIC KEY-----"
)
sha = hashlib.sha256(pub_pem.encode("utf-8")).hexdigest()
node_id = f"node_{sha[:12]}"
```

### Option B: Fix Client (faster fix)
Make MEPIdentity hash the same raw base64 that Hub hashes:
```python
# Instead of hashing PEM string, hash the raw public key bytes
raw_pubkey = self.public_key.public_bytes(
    encoding=serialization.Encoding.Raw,
    format=serialization.PublicFormat.Raw
)
sha = hashlib.sha256(raw_pubkey).hexdigest()
self.node_id = f"node_{sha[:12]}"
```

**Recommendation: Option A** — the Hub should match what the client produces, since changing the Hub's registration is harder (all existing registered nodes would need to re-register).

## Files Involved

| File | Role |
|------|------|
| `MEP/node/identity.py` | Client — `MEPIdentity.pub_pem` uses PEM SubjectPublicKeyInfo |
| `MEP/hub/auth.py` | Hub — `derive_node_id()` hashes raw base64 string |
| `MEP/hub/main.py:771` | Hub register handler calls `auth.derive_node_id(node.pubkey)` |

## Detection

```bash
# Register a node
curl -X POST https://mep-hub.silentcopilot.ai/register \
  -H "Content-Type: application/json" \
  -d '{"pubkey": "MCowBQYDK2VwAyEAz59NLQioD1UU6YUvEy7G4yrFjBO9+bKjyrUS3li6Hd4=", "alias": "test"}'

# Hub returns: node_id = "node_21e1ccb0dfbd"
# But client computes: node_id = "node_635d159bde2a"
# → Mismatch!
```

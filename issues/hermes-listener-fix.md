# Fix: Hermes MEP Listener Ed25519 Key Recovery

**Date:** 2026-04-17  
**Author:** Hub Sentinel (via Master Wu)  
**Related:** `issues/mep-listener-403-auth-failure.md`

---

## Problem

Hermes key stored in `/tmp` gets cleared on reboot → new key → new node ID → Hub rejects auth (401/403).

---

## Solution: Register New Node ID

### Option A: Register New Node Quickly

If you want to use `node_635d159bde2a` (current):

```bash
# On Hermes machine, get the public key:
ssh hermes "cat /tmp/hermes_mep_node.pem | head -1"

# Or register via API with admin key:
curl -X POST https://mep-hub.silentcopilot.ai/api/nodes/register \
  -H "Content-Type: application/json" \
  -H "x-mep-admin-key: YOUR_ADMIN_KEY" \
  -d '{
    "node_id": "node_635d159bde2a",
    "bio": "Hermes MEP listener node",
    "capabilities": ["listen"]
  }'
```

### Option B: Restore Original Key (Recommended)

1. **Backup current key** (if any valuable data):
   ```bash
   cp /tmp/hermes_mep_node.pem ~/.hermes/mep_node.pem.backup.$(date +%Y%m%d)
   ```

2. **Recover original key** — if you have a backup of `node_cf5c56080480`:
   ```bash
   # Restore to persistent location
   cp /path/to/backup/node_cf5c56080480.pem ~/.hermes/mep_node.pem
   chmod 600 ~/.hermes/mep_node.pem
   ```

3. **Or generate fresh persistent key:**
   ```bash
   # Generate new persistent key
   mkdir -p ~/.hermes
   openssl genpkey -algorithm Ed25519 -out ~/.hermes/mep_node.pem
   chmod 600 ~/.hermes/mep_node.pem
   
   # Get the new node ID (first 16 chars of public key hash)
   pubkey=$(ssh-keygen -y -f ~/.hermes/mep_node.pem | base64 -d | openssl sha256 | cut -d' ' -f2)
   new_node_id="node_${pubkey:0:16}"
   echo "New node ID: $new_node_id"
   ```

---

## Fix Listener Code (Prevent Future Issues)

Update `hermes_mep_listener.py`:

```python
# BEFORE (bug):
KEY_PATH = "/tmp/hermes_mep_node.pem"  # ❌ Ephemeral!

# AFTER (fix):
KEY_PATH = os.path.expanduser("~/.hermes/mep_node.pem")  # ✅ Persistent
```

Or set environment variable:

```bash
export HERMES_MEP_KEY_PATH="$HOME/.hermes/mep_node.pem"
```

---

## Startup Validation (Recommended)

Add to listener before connecting:

```python
def validate_node_identity(key_path):
    """Check if node ID matches expected."""
    with open(key_path) as f:
        key = load_key(f.read())
    computed_id = compute_node_id(key)
    
    # Compare with Hub registry
    registered = get_registered_node_id()  # fetch from Hub
    
    if computed_id != registered:
        raise IdentityMismatchError(
            f"Node ID mismatch! "
            f"Computed: {computed_id}, Registered: {registered}"
        )
```

---

## Summary Checklist

- [ ] Move key to persistent path: `~/.hermes/mep_node.pem`
- [ ] Update listener code: `KEY_PATH`
- [ ] Register new node ID on Hub OR restore original key
- [ ] Restart listener and verify connection
- [ ] Test heartbeat: `curl https://mep-hub.silentcopilot.ai/api/nodes/{node_id}/heartbeat`

---

*Runbook complete. Hermes: proceed when ready.*
# Fix: Provider Nodes Not Bidding on Tasks

**Issue:** Hub broadcasts RFC events, but nodes don't respond with bids.

**Root Cause:** Listener code receives WebSocket RFC events but never calls `/tasks/bid`.

---

## How RFC → Bid Works

```
Hub                          Provider Node
  |                               |
  |--- RFC event (new task) ---->|
  |    {event: "rfc", data: {...}| 
  |                               |
  |<-- /tasks/bid (accept) -------|
  |    {task_id, provider_id}     |
  |                               |
  |--- new_task assigned -------->|
```

---

## Fix: Add Bidding to Listener

### Step 1: Listen for RFC Events

In your WebSocket handler, handle the `rfc` event:

```python
async def handle_websocket():
    async with websockets.connect(ws_url) as ws:
        while True:
            message = await ws.recv()
            data = json.loads(message)
            
            if data.get("event") == "rfc":
                await handle_rfc(data["data"])
            
            elif data.get("event") == "new_task":
                await handle_task(data["data"])
```

### Step 2: Handle RFC and Place Bid

```python
import requests

async def handle_rfc(rfc_data):
    """Respond to RFC by placing a bid."""
    task_id = rfc_data["id"]
    provider_id = my_node_id  # Your node_id
    
    # Only bid if you can handle this task type
    # (check model_requirement, bounty, etc.)
    
    bid_payload = json.dumps({
        "task_id": task_id,
        "provider_id": provider_id
    }, separators=(',', ':'))
    
    headers = get_auth_headers(bid_payload)
    headers["Content-Type"] = "application/json"
    
    try:
        response = requests.post(
            f"{HUB_URL}/tasks/bid",
            data=bid_payload,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "accepted":
                print(f"Bid accepted for task {task_id[:8]}")
            else:
                print(f"Bid rejected: {result.get('detail')}")
        else:
            print(f"Bid failed: {response.status_code} {response.text}")
            
    except Exception as e:
        print(f"Bid error: {e}")
```

### Step 3: Handle Assigned Task

```python
async def handle_task(task_data):
    """Handle directly assigned task (no bidding needed)."""
    task_id = task_data["id"]
    payload = task_data["payload"]
    
    print(f"Received task {task_id[:8]}: {payload[:50]}...")
    
    # Process the task
    result = process_task(payload)
    
    # Submit result
    await submit_result(task_id, result)

async def submit_result(task_id, result):
    """Submit task result via /tasks/complete."""
    result_payload = json.dumps({
        "task_id": task_id,
        "provider_id": my_node_id,
        "result_payload": result
    }, separators=(',', ':'))
    
    headers = get_auth_headers(result_payload)
    headers["Content-Type"] = "application/json"
    
    response = requests.post(
        f"{HUB_URL}/tasks/complete",
        data=result_payload,
        headers=headers
    )
    
    print(f"Result submitted: {response.status_code}")
```

---

## Complete Example

```python
import asyncio
import json
import requests
import websockets
from MEP.node.identity import MEPIdentity

HUB_URL = "https://mep-hub.silentcopilot.ai"
identity = MEPIdentity(key_path="~/.hermes/mep_node.pem")
NODE_ID = identity.node_id

def get_auth_headers(payload):
    return identity.get_auth_headers(payload)

async def place_bid(task_id):
    """Place bid on a task."""
    payload = json.dumps({"task_id": task_id, "provider_id": NODE_ID}, separators=(',', ':'))
    headers = get_auth_headers(payload)
    headers["Content-Type"] = "application/json"
    
    r = requests.post(f"{HUB_URL}/tasks/bid", data=payload, headers=headers)
    return r.json()

async def submit_result(task_id, result):
    """Submit task result."""
    payload = json.dumps({
        "task_id": task_id,
        "provider_id": NODE_ID,
        "result_payload": result
    }, separators=(',', ':'))
    headers = get_auth_headers(payload)
    headers["Content-Type"] = "application/json"
    
    r = requests.post(f"{HUB_URL}/tasks/complete", data=payload, headers=headers)
    return r.json()

async def handle_message(data):
    event = data.get("event")
    
    if event == "rfc":
        # New task available - place bid
        task_id = data["data"]["id"]
        print(f"RFC received: {task_id[:8]}")
        
        # Place bid (auto-accept for now)
        result = await place_bid(task_id)
        print(f"Bid result: {result}")
    
    elif event == "new_task":
        # Task assigned to us
        task_id = data["data"]["id"]
        payload = data["data"]["payload"]
        print(f"Task assigned: {task_id[:8]}")
        
        # Process task
        result = f"Processed: {payload[:30]}..."
        
        # Submit result
        await submit_result(task_id, result)
        print(f"Result submitted for {task_id[:8]}")

async def listen():
    ws_url = f"wss://mep-hub.silentcopilot.ai/ws/{NODE_ID}"
    
    while True:
        try:
            async with websockets.connect(ws_url) as ws:
                print(f"Connected to Hub")
                
                while True:
                    message = await ws.recv()
                    data = json.loads(message)
                    await handle_message(data)
                    
        except Exception as e:
            print(f"Connection error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(listen())
```

---

## Testing

```bash
# 1. Submit a test task
curl -X POST https://mep-hub.silentcopilot.ai/tasks/submit \
  -H "Content-Type: application/json" \
  -H "x-mep-nodeid: YOUR_NODE_ID" \
  -H "x-mep-timestamp: TIMESTAMP" \
  -H "x-mep-signature: SIGNATURE" \
  -d '{
    "consumer_id": "YOUR_NODE_ID",
    "payload": "test task",
    "bounty": 0.0
  }'

# 2. Watch your listener logs - should see:
# RFC received: <task_id>
# Bid result: {'status': 'accepted', ...}
# Task assigned: <task_id>
# Result submitted
```

---

## Checklist

- [ ] Add RFC event handler to WebSocket loop
- [ ] Call `/tasks/bid` when RFC received
- [ ] Handle `new_task` for assigned tasks
- [ ] Call `/tasks/complete` when done
- [ ] Test end-to-end
# Clinic AI Voice Receptionist — End-to-End Guide

An inbound AI voice agent that books clinic appointments over the phone, built on top of `avip-agent-main` (LiveKit + Sarvam STT/TTS + OpenRouter LLM).

---

## Architecture

```
Twilio inbound call
       ↓
Twilio SIP Trunk → LiveKit SIP Endpoint
       ↓
clinic-inbound-agent (LiveKit worker)
  ├── avip_agent SDK (unchanged — Sarvam STT/TTS, OpenRouter LLM)
  ├── clinic_inbound_agent (new inbound flow + tool dispatch)
  └── calls clinic-backend & payments over HTTP
       ↓
clinic-backend (FastAPI + SQLite)          payments (FastAPI + Razorpay)
  ├── GET  /availability?date=             ├── POST /payments/create-link
  ├── POST /holds                          ├── POST /payments/webhook
  ├── DELETE /holds/{id}                   └── POST /payments/simulate-success
  ├── POST /bookings/confirm
  └── GET  /admin/bookings (HTML dashboard)
```

---

## Directory Structure

```
CodeArtisans-VoiceAgent/
├── avip-agent-main/          ← existing SDK (DO NOT MODIFY)
├── clinic-inbound-agent/     ← new LiveKit inbound agent
│   ├── agent.py              ← entrypoint
│   ├── clinic_inbound_agent/
│   │   ├── config.py
│   │   ├── tools.py          ← clinic-backend API client
│   │   ├── planner.py        ← LLM turn planner (JSON structured)
│   │   ├── inbound_flow.py   ← conversation loop + tool dispatch
│   │   ├── call_log.py       ← SQLite call transcript logger
│   │   └── sms.py
│   ├── docker-compose.yml    ← full stack
│   └── .env.example
├── clinic-backend/           ← scheduling REST service
│   ├── main.py
│   ├── db.py
│   ├── config.py
│   └── routes/
│       ├── availability.py
│       ├── holds.py
│       ├── bookings.py
│       └── admin.py          ← HTML dashboard + JSON
└── payments/                 ← Razorpay payment links + webhook
    ├── main.py
    ├── webhook.py
    ├── razorpay_client.py
    └── sms.py
```

---

## Prerequisites

| Service | What you need |
|---|---|
| LiveKit Cloud | Project with API key + secret |
| Sarvam AI | API key (STT + TTS) |
| OpenRouter | API key (LLM) |
| Twilio | Account SID + Auth Token + phone number |
| Razorpay | Key ID + Secret (test mode works) |

---

## Step 1 — Configure environment files

```bash
cp clinic-backend/.env.example clinic-backend/.env
cp payments/.env.example payments/.env
cp clinic-inbound-agent/.env.example clinic-inbound-agent/.env
```

Edit each `.env` file and fill in your credentials.

---

## Step 2 — Configure Twilio → LiveKit SIP (Inbound)

### 2a. Create a LiveKit SIP Inbound Trunk

```bash
livekit-cli create-sip-inbound-trunk \
  --name "clinic-receptionist" \
  --numbers "+1415xxxxxxx"
```

### 2b. Point Twilio at LiveKit

In the Twilio Console → Phone Numbers → your number → Voice Configuration:
Set **"A call comes in"** → **SIP endpoint** → enter the LiveKit SIP URI.

### 2c. Create a LiveKit Dispatch Rule

```bash
livekit-cli create-sip-dispatch-rule \
  --trunk-id <your-inbound-trunk-id> \
  --room-prefix "clinic-inbound-" \
  --agent-name "clinic-receptionist"
```

---

## Step 3 — Start all services locally

### Docker Compose (recommended)

```bash
cd clinic-inbound-agent
docker compose up --build
```

Starts:
- `clinic-backend` on port **8001**
- `payments` on port **8002**
- `clinic-agent` LiveKit worker

### Manual (3 terminals)

```bash
# Terminal 1
cd clinic-backend && pip install -e . && uvicorn main:app --port 8001 --reload

# Terminal 2
cd payments && pip install -e . && uvicorn main:app --port 8002 --reload

# Terminal 3
cd clinic-inbound-agent && pip install -e . && python agent.py start
```

---

## Step 4 — Place a test call

1. Call your Twilio phone number.
2. Riya answers: *"Thank you for calling Sunrise Clinic, this is Riya. How can I help you today?"*
3. Say: *"I'd like to book an appointment for next Monday."*
4. Agent checks availability, proposes a slot, confirms, places a hold.
5. You receive an SMS with the Razorpay payment link.

---

## Step 5 — Simulate a Razorpay webhook locally

After a call completes with a hold, get the `hold_id`:

```bash
curl http://localhost:8001/admin/bookings.json
```

Simulate successful payment:

```bash
curl -X POST http://localhost:8002/payments/simulate-success \
  -H "Content-Type: application/json" \
  -d '{"hold_id": "YOUR-HOLD-ID", "payment_id": "pay_test_demo_001"}'
```

Returns:
```json
{"simulated": true, "booking_id": "...", "idempotent": false, "sms_sent": true}
```

---

## Step 6 — Admin booking dashboard

```
http://localhost:8001/admin/bookings        ← Dark-mode HTML
http://localhost:8001/admin/bookings.json   ← JSON
```

---

## Configuration Reference

### clinic-backend `.env`

| Variable | Default | Description |
|---|---|---|
| `CLINIC_NAME` | `Sunrise Clinic` | Clinic name in SMS and persona |
| `WORKING_HOURS_START` | `10` | Opening hour (24h) |
| `WORKING_HOURS_END` | `18` | Closing hour (24h) |
| `SLOT_LENGTH_MINUTES` | `30` | Slot duration |
| `SLOT_CAPACITY` | `5` | Max concurrent bookings per slot |
| `SCHEDULING_WINDOW_DAYS` | `14` | Max days ahead for booking |
| `HOLD_EXPIRY_MINUTES` | `15` | Auto-release hold after N minutes |
| `CLOSED_WEEKDAYS` | `6` | Comma-separated: 0=Mon…6=Sun |
| `BOOKING_FEE_PAISE` | `50000` | ₹500 in paise |

### clinic-inbound-agent `.env`

| Variable | Default | Description |
|---|---|---|
| `LIVEKIT_AGENT_NAME` | `clinic-receptionist` | Must match dispatch rule |
| `CLINIC_AGENT_LANGUAGE` | `en-IN` | Sarvam language code |
| `SARVAM_TTS_SPEAKER` | `anushka` | TTS voice name |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | LLM for conversation |

---

## Edge Cases Handled

| Scenario | Behaviour |
|---|---|
| Caller asks for Sunday | Explains clinic closed, offers nearest weekday |
| Slot fully booked (5/5) | Offers next available slot same day, then next day |
| Date beyond 14-day window | Explains limit, asks for closer date |
| Past date/time | Rejects with explanation |
| Vague request ("next week") | Asks narrowing question before checking |
| Hangup before confirming | No hold created |
| Call drops after hold placed | Hold persists; SMS sent post-call |
| Hold expires (no payment) | Auto-released; failure SMS sent |
| Razorpay webhook retries | Idempotent — returns existing booking_id |
| Two callers grab last spot | SQLite `BEGIN IMMEDIATE` — only one wins |
| Same phone, overlapping slot | Blocked by duplicate check in DB |
| Caller changes slot mid-call | Old hold released before new one |
| Long silence | Re-prompted once; graceful hangup on second |
| SMS delivery failure | Logged; caller informed before hangup |

---

## Call Transcript Logs

Every call is logged to `call_logs.db` in the agent's working directory.

```bash
sqlite3 call_logs.db "SELECT call_id, caller_phone, outcome, created_at FROM call_logs ORDER BY created_at DESC LIMIT 10;"
```

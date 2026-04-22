---
applyTo: "**/*.ts"
---

# AI Processing Pipeline

Single-pass LLM analysis with active module filtering.

## Pipeline Steps

1. User submits message
2. Fetch user's active modules and their current versions
3. Send message + all active module definitions to LLM
4. LLM analyzes message and extracts data for relevant modules only
5. Store structured data inside user event with module version references
6. Optionally generate system response if needed

---

# Modules System

## Master Modules

Central definitions stored in Firestore.

Each master module has:
- `id`: string (unique)
- `name`: string
- `description`: string
- `schema`: schema definition (JSON Schema or similar)
- `version`: number (incremented on changes)
- `active`: boolean
- `prompt_instructions`: string (guidance for LLM)

## User Modules

Copied from master modules when user is created.

Rules:
- User modules can evolve independently
- Changes to master modules do not affect existing user copies
- Each user module tracks its own version history
- Versioning allows re-processing if needed

---

# Data Extraction

## Input

- Raw user message
- User's active modules (with current versions)
- Module schemas and prompt instructions

## LLM Responsibility

1. Analyze message against all active modules
2. Determine which modules are relevant
3. Extract structured data only for relevant modules
4. Output namespace per module:
   ```json
   {
     "modules_used": {
       "mood": { "version": 2 },
       "exercise": { "version": 1 }
     },
     "analysis": {
       "mood": {...},
       "exercise": {...}
     }
   }
   ```

## Storage

- Structured data is stored inside the user event as an array, NOT in separate `system_generated` events
- Each processing pass appends a new entry with an incremented `version` number
- Never overwrite previous entries → append for full history
- Latest analysis is always the entry with the highest `version`
- Always preserve `modules_used` to maintain traceability
- Status transitions: `pending` → `processing` → `processed`
- Clients never process LLM outputs locally

---

# Response Generation

- Only generate `system_generated` responses when system needs to reply to user
- Base responses on structured data, not only raw text
- Link responses to their originating user events via `related_event_id`
- Clients receive responses automatically via snapshot listeners

---

# Important Constraints

- Keep module schemas compact but not minimalist
- Versioning must be tracked for every module used
- Never lose raw user input
- Avoid blocking the user for AI response
- Always preserve traceability between events and module versions
- Do not hardcode module logic
- Design for easy addition of new modules
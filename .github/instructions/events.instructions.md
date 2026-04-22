---
applyTo: "**/*.ts"
---

This app uses an event-based architecture.

Each user interaction is stored as an event.

## User Events (user_note, user_deep)

Generated directly from user input. Created with `status: pending` and empty `structured_data`, then updated with analysis results as processing completes.

```json
{
  id: string,
  timestamp: string,
  type: "user_note" | "user_deep",
  source: "text" | "voice" | "photo",
  user_input: string,
  media?: [],
  modules_active: string[],
  structured_data: [
    {
      version: number, // 1, 2, 3...
      processed_at: string,
      modules_used: {
        module_id: { version: number },
        ...
      },
      analysis: {
        mood: {...},
        exercise: {...},
        food: {...}
        ...
      }
    }
  ],
  status: "pending" | "processing" | "processed" | "failed" | "archived",
  processed_at?: string
}
```

## System Generated Events (system_generated)

Generated only when the system needs to respond to the user. Always reference related user events.

```json
{
  id: string,
  timestamp: string,
  type: "system_generated",
  related_event_id: string,
  content: string,
  metadata?: Record<string, any>
}
```

## Rules

- Events maintain **full traceability** through versioning, not immutability
- Initial state: `status: pending`, `structured_data: []`
- After processing: `structured_data` contains one entry with `version: 1`
- If re-processed: `structured_data` grows with a new entry with `version: 2`, etc.
- Never overwrite or delete analysis data → append new versioned entries instead
- Latest analysis is always the last entry (highest `version`)
- `structured_data[n].analysis` must be namespaced per module (only for user events)
- `structured_data[n].modules_used` references which module versions were used
- Design code to support **re-processing events** if module versions change
- Clients should only read events; **never process messages locally**
- Analysis without user-facing response stays inside the user event
- Only create `system_generated` events when the system has a response to show
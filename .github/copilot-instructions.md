# Project Overview

Mobile app built with:
- Expo + Expo Router
- Firebase (Firestore)
- Zustand
- NativeWind
- React Hook Form
- OpenAI API
- Cloudflare R2

This is an AI-powered journaling system based on event processing.

---

# Core Architecture

- Everything is an event stored in Firestore
- Events maintain full traceability through status and versioned analysis: `pending` → `processed` with v1, v2, etc.
- User events include their own analysis results with module version references
- Modifications accumulate versions instead of overwriting (re-processing adds v2, v3, etc.)
- AI processes events in a single pass against all user's active modules
- Clients **do not process LLM responses**
- Clients listen to Firestore updates with onSnapshot or similar
- System maintains master and user module copies with independent versioning

---

# Key Principles

- Keep code simple and pragmatic
- Avoid overengineering
- Prefer reusable functions, utilities and components
- Prefer flat data structures
- Use async/await
- Avoid `any`
- Always type everything explicitly: function parameters, return types, variables, and data structures

---

# State Management

- Zustand is only for UI state and caching
- Firestore is the source of truth
- Do not attempt to process AI responses in the client

---

# What to Avoid

- SQL or relational patterns
- Tight coupling between modules
- Mixing UI and data logic
- Blocking the user while waiting for AI responses
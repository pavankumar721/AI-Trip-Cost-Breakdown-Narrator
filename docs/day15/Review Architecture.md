Browser
   ↓
React Frontend
   ↓
Express Backend
   ↓
Prompt V4
   ↓
OpenRouter AI
   ↓
Response
   ↓
History Storage

# Architecture Review

Frontend:
React application collects customer input.

Backend:
Express API validates input and generates prompts.

AI Layer:
OpenRouter processes Prompt V4 and returns narration.

Storage:
History stored locally in JSON file.

Future:
Move history and prompts to PostgreSQL.

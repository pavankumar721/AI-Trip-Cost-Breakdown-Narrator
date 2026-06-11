# AI-Trip-Cost-Breakdown-Narrator
## Backend Setup

### Create Environment File

Create a `.env` file in the backend folder.

Add:

OPENROUTER_API_KEY=your_api_key_here

### Install Dependencies

npm install

### Run Backend

node server.js

### API Endpoints

POST /api/generate

Generate AI trip narration.

GET /api/history

View all saved generations.

GET /api/history/:id

View a specific saved generation.

# ayurvedic-app

## Environment Variables

The backend requires the following environment variables to be set in `backend/.env` for the AI chatbot to function properly:

- `GROQ_API_KEY` (Required): Authentication key for the Groq LLM API. Get it from https://console.groq.com. The backend will crash without this.
- `YOUTUBE_API_KEY` (Optional): YouTube Data API v3 key for fetching health-related video recommendations. If omitted, the chatbot will fall back to search URLs.

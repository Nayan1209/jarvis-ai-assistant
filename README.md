# Jarvis AI Voice Assistant

A full-stack AI assistant with a voice-first frontend, FastAPI backend, provider abstraction for OpenAI, Android packaging, and Docker-ready deployment.

## Features

- Push-to-talk voice input
- Always-listen voice mode
- Native Android speech recognition and text-to-speech through Capacitor
- Browser speech recognition and speech synthesis fallback
- Text chat fallback for unsupported browsers
- FastAPI backend that keeps API keys off the client
- Conversation memory per browser session
- Health endpoint for hosting checks
- Docker and Docker Compose deployment files
- GitHub Pages workflow and Play Store prep docs

## Project Structure

```text
jarvis-ai-assistant/
  backend/       FastAPI API service
  frontend/      React + Vite web app + Capacitor Android wrapper
  docs/          Deployment and Play Store notes
  docker-compose.yml
  render.yaml
```

## Requirements

- Node.js 20+
- Python 3.11+
- An OpenAI API key
- Android Studio for Play Store builds

## Local Setup

1. Configure backend environment:

```bash
cp backend/.env.example backend/.env
```

Set `OPENAI_API_KEY` in `backend/.env`.

2. Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Android

```bash
cd frontend
npm install
npm run mobile:sync
npm run mobile:open
```

Use Android Studio to generate a signed Android App Bundle (`.aab`) for Google Play.

## Docker Deployment

Create `backend/.env` first, then run:

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:8000/health`

## Hosted Deployment

This repo includes `render.yaml` for Render blueprints and `.github/workflows/frontend-pages.yml` for GitHub Pages.

Required production env vars:

- `OPENAI_API_KEY`
- `ALLOWED_ORIGINS`
- `VITE_API_BASE_URL`

## Production Notes

- Set `ALLOWED_ORIGINS` to the deployed frontend URL.
- Use HTTPS in production because browsers require it for microphone access outside localhost.
- Keep `OPENAI_API_KEY` only on the backend host.
- For Render/Railway/Fly.io, deploy `backend/Dockerfile` and set env vars in the platform dashboard.
- For Play Store, the app must call a public HTTPS backend.

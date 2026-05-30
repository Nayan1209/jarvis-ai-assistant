# Deployment Checklist

This project has three deployable pieces:

1. Source code on GitHub
2. Backend API on a server such as Render or Railway
3. Android app on Google Play

GitHub can host the repository and the static frontend, but it cannot host the FastAPI backend by itself. The mobile app must call a public HTTPS backend URL.

## 1. GitHub

Recommended repo name:

```text
jarvis-ai-assistant
```

Do not commit these:

- `backend/.env`
- `frontend/node_modules`
- `frontend/dist`
- `backend/.venv`

After the repo exists, enable GitHub Pages:

1. Open repository Settings.
2. Open Pages.
3. Set Source to GitHub Actions.
4. Add repository variable `VITE_API_BASE_URL` with your deployed backend URL.
5. Push to `main`.

Privacy policy URL after Pages deploy:

```text
https://YOUR_GITHUB_USERNAME.github.io/jarvis-ai-assistant/privacy-policy.html
```

## 2. Backend Hosting

Use Render, Railway, Fly.io, or another Docker/Python host.

Required backend environment variables:

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
ASSISTANT_NAME=Jarvis
ALLOWED_ORIGINS=https://your-frontend-domain
```

After deploy, confirm:

```text
https://your-backend-domain/health
```

returns:

```json
{"status":"ok"}
```

## 3. Frontend Hosting

Set:

```env
VITE_API_BASE_URL=https://your-backend-domain
```

Then build:

```bash
cd frontend
npm install
npm run build
```

## 4. Android / Play Store

Google Play expects an Android App Bundle (`.aab`). This project uses Capacitor to wrap the web app.

Install Android Studio, then run:

```bash
cd frontend
npm install
npm run mobile:init
npm run mobile:sync
npm run mobile:open
```

In Android Studio:

1. Open the generated `frontend/android` project.
2. Set the production `VITE_API_BASE_URL` before building.
3. Create or choose a signing key.
4. Build > Generate Signed Bundle / APK.
5. Select Android App Bundle.
6. Upload the `.aab` file to Play Console.

Before production release, complete:

- App name
- Short description
- Full description
- App icon
- Feature graphic
- Screenshots
- Privacy policy URL
- Data safety form
- Content rating
- Target audience
- Internal testing release

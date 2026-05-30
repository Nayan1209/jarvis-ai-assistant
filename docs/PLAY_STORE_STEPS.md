# Google Play Store Steps

Use this as the exact submission checklist.

## Account

1. Create or open a Google Play Console developer account.
2. Complete identity and payments profile verification.
3. Pay Google's one-time developer registration fee if the account is new.

Do not share your Google password in chat. Sign in directly in the browser when needed.

## App Setup

1. Click Create app.
2. App name: `Jarvis AI Assistant`
3. Default language: English
4. App or game: App
5. Free or paid: Free
6. Confirm developer declarations.

Package name:

```text
com.nayan.jarvisassistant
```

Package names are permanent after upload, so keep this stable.

## Store Listing Draft

Short description:

```text
Voice-first AI assistant with push-to-talk and always-listen modes.
```

Full description:

```text
Jarvis AI Assistant helps you ask questions by voice or text and receive spoken responses. Use push-to-talk when you want direct control, or always-listen mode for hands-free interaction. The app uses a secure backend to process AI responses and keeps API keys off the device.
```

## Privacy / Data Safety

Declare that the app may collect or process:

- Voice/audio input
- Text prompts
- AI responses
- Basic app diagnostics if hosting logs are enabled

Purpose:

- App functionality
- AI assistant response generation

The app sends prompts to your backend, and the backend sends them to the configured AI provider.

## Release Flow

1. Build signed `.aab` in Android Studio.
2. Upload to Internal testing first.
3. Add testers.
4. Fix Play Console warnings.
5. Promote to closed/open testing if required by your account.
6. Submit for production review.

## Important Google Play Notes

- New apps should be uploaded as Android App Bundles (`.aab`).
- Play Console will ask for app signing setup during release.
- A privacy policy URL is required for apps that process personal or sensitive data, including voice.
- The app backend must use HTTPS in production.

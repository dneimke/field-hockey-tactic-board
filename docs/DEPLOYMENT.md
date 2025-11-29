# Deployment Guide

This project is deployed to **Google Cloud** using **Firebase Hosting** and **Firebase Cloud Functions**.

## Architecture

-   **Frontend**: Hosted on Firebase Hosting (static assets served via CDN).
-   **Backend**: A Firebase Cloud Function (`generateContent`) acts as a secure proxy for the Gemini API. This ensures the `GEMINI_API_KEY` is never exposed to the client.

## Prerequisites

1.  **Firebase CLI**: Install the Firebase CLI tools.
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login**: Log in to your Google account.
    ```bash
    firebase login
    ```

## Configuration

The project is already configured with:
-   `firebase.json`: Defines hosting rules and function settings.
-   `.firebaserc`: Maps the project alias to the Firebase project ID.
-   `functions/`: Contains the backend code.

## Managing Secrets

The application uses **Firebase Secrets** to securely store the Gemini API key.

### Setting the API Key
To set or update the API key for the Cloud Function:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```
Paste your API key when prompted.

### Checking Secrets
To see which secrets are configured:
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

## Deployment

To deploy both the frontend application and the backend functions, run:

```bash
firebase deploy
```

This command will:
1.  Build the Vite application (`npm run build`).
2.  Package the Cloud Functions.
3.  Upload everything to Firebase.

### Partial Deployment
If you only want to deploy specific parts:

-   **Hosting only**: `firebase deploy --only hosting`
-   **Functions only**: `firebase deploy --only functions`

## Troubleshooting

### "Missing required API"
If deployment fails due to missing APIs (e.g., Cloud Build, Artifact Registry), the Firebase CLI will usually offer to enable them for you. Say "Yes" to these prompts.

### "Runtime decommissioned"
If you see an error about Node.js versions, check `functions/package.json` and ensure the `engines` field specifies a supported version (e.g., `"node": "22"`).

### Function Logs
To view logs for the deployed function:
```bash
firebase functions:log
```

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QL9Ex8XvJySlySK89PedtfaeGRn3AP-V

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) Add integration secrets to `.env.local` to sync activities:
   - `VITE_STRAVA_CLIENT_ID`
   - `VITE_STRAVA_CLIENT_SECRET`
   - `VITE_STRAVA_REDIRECT_URI` (defaults to app origin)
   - `VITE_GARMIN_CLIENT_ID`
   - `VITE_GARMIN_CLIENT_SECRET`
   - `VITE_GARMIN_AUTH_URL`
   - `VITE_GARMIN_TOKEN_URL`
   - `VITE_GARMIN_API_BASE`
   - `VITE_GARMIN_REDIRECT_URI` (defaults to app origin)
4. Run the app:
   `npm run dev`

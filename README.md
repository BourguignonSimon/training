# AI Fitness Studio — Plain-English Guide

## What this project is
This project is a web app that helps you understand and review your fitness activities. It connects to services like **Strava** and **Garmin**, brings your activities together, and uses AI to summarize or explain them in simple terms. You open it in your web browser like any other website.

## Who it’s for
- Anyone who wants a simple, friendly view of their workouts.
- Coaches or friends who want to review activity summaries.
- Non‑technical users who want a clear, guided experience.

## What you can do with it
- Connect your fitness accounts (Strava/Garmin).
- See your activities in one place.
- Ask the AI to summarize your workouts and highlight trends.

## How to use it (simple version)
1. **Get access to the app** (ask the project owner for a live link).
2. **Open the link in your browser** (Chrome, Safari, Edge, etc.).
3. **Connect your fitness accounts** if you want your data included.
4. **Use the AI tools** to ask questions or review summaries.

> If you don’t see a live link, ask the project owner to deploy it for you.

## If you want to run it yourself (more technical)
**Prerequisites:** Node.js installed on your computer.

1. Install dependencies: `npm install`
2. Add a Gemini API key in a file called `.env.local`:
   - `VITE_GEMINI_API_KEY=your_key_here`
3. (Optional) Add Strava/Garmin details to `.env.local` to sync activities.
4. Start the app: `npm run dev`

## Actions needed to make the solution work better (enhancements)
1. **Provide a public live link** so non‑technical users can access it easily.
2. **Create a simple onboarding flow** (step‑by‑step screens) to connect Strava/Garmin without confusion.
3. **Add a “sample data” mode** so people can try the app without linking accounts.
4. **Improve the AI prompts** so the summaries are more consistent and easy to understand.
5. **Add privacy explanations** in plain language (what data is used, when, and why).
6. **Set up error messages and help tips** for common problems (missing API key, failed account connection, etc.).
7. **Create a feedback button** so users can report issues or request features.

## Deployment notes (for the project owner)
Set these environment variables on the hosting platform:
- `VITE_GEMINI_API_KEY`
- (Optional) Strava and Garmin variables if you want account syncing.

The production build is in the `dist/` folder after running: `npm run build`

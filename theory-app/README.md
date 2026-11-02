# תאוריה בכיס – Theory test trainer (Israel, license B)

An offline Android app (Hebrew, RTL) for studying for the Israeli driving theory test.

**Download the APK on your phone:**
https://github.com/yo12344444444444/open-cnc-for-all/releases/download/theory-app-latest/theory-app.apk

Open it on the phone, allow "install from unknown sources", and install.
Each new build installs over the old one and keeps your progress.

## What's inside

| Feature | How it helps you learn |
|---|---|
| **Daily practice** | Spaced repetition (Leitner boxes). Correct answers come back after 1, 2, 4, 8… days. Wrong answers come back the same day, and again later in the same session. |
| **Full exam** | 30 questions, 40 minutes, pass with at most 4 mistakes, just like the real test. You get no feedback until you submit, then a full review. |
| **By topic** | Traffic rules, signs, safety, vehicle. Each topic shows a mastery bar. |
| **My mistakes / bookmarks** | Focused practice on weak questions. |
| **Progress** | Pass-probability estimate, streak, 14-day activity, per-topic mastery, exam history. |
| **Question bank** | Search and browse every question. |

Answer order is shuffled every time, so you learn the content and not the answer's position.
Progress stays on the phone and can be backed up as a text code in Settings.

## Question bank

- At build time, GitHub Actions downloads the **official Ministry of Transport bank** from data.gov.il,
  keeps the license-B questions, and bundles their images so they work offline (`scripts/fetch-questions.mjs`).
- If that download fails, the app ships with an **81-question built-in practice set** (`scripts/fallback-src.mjs`).
  You can still download the official bank from inside the app (Settings → update question bank).

## Build

Every push to `theory-app/**` runs `.github/workflows/theory-app-apk.yml`, which builds the APK with Capacitor
and publishes it to the `theory-app-latest` release.

Local web preview: `npm run serve`, then open http://localhost:8765

> `signing/debug.keystore` is a throwaway debug key, committed so every CI build has the same signature and updates install cleanly.
> Don't use it for a Play Store release.

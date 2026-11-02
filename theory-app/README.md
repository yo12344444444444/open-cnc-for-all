# תאוריה בכיס – Theory test trainer (Israel, license B)

An offline Android app (Hebrew, RTL) for studying for the Israeli driving theory test.

**Download the APK on your phone:**
https://github.com/yo12344444444444/open-cnc-for-all/releases/download/theory-app-latest/theory-app.apk

Open it on the phone, allow "install from unknown sources", and install.
Each new build installs over the old one and keeps your progress.

## What's inside

| Feature | How it helps you learn |
|---|---|
| **Onboarding** | Asks for the test date and minutes per day, then sets the daily plan. |
| **"Continue" button** | Always leads to the right next step: a lesson, then a practice round, then the next lesson, and mock exams when you're ready. |
| **Learn-from-zero path** | 10 short lessons (key terms, signs by shape and color, right of way, speed, parking, lights, alcohol and fatigue, new driver, safety, vehicle). Each lesson is followed by practice on matching official questions. |
| **"How to learn" guide** | The method (retrieval practice, spacing, mixing topics), a 2–4 week plan, and how to learn from a mistake. |
| **Daily practice** | Spaced repetition (Leitner boxes). Correct answers come back after 1, 2, 4, 8… days; wrong answers come back the same day. New questions per day scale with the test date so the whole bank is covered, and every question gets a last review 2 days before the test. |
| **🎲 "I guessed" / "I don't know"** | A lucky guess doesn't count as known. |
| **Full exam** | 30 questions, 40 minutes, pass with at most 4 mistakes. "Ready" means 3 passes in a row with at most 2 mistakes. |
| **Honest readiness** | Pass probability (binomial model on per-question recall, using your own first-try accuracy and mock-exam results). It's shown only after 15% of the bank; before that, coverage is shown instead. |
| **Also** | Topic practice, mistakes, bookmarks, search the whole bank, streaks, 14-day chart, a daily reminder notification, dark mode, text size, backup code. |

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

# Crazy 8 — Ideation Workout

A browser-based timer and coaching tool for running the **Crazy 8** design-sprint exercise. In 8 minutes, participants sketch 8 distinct ideas — one per 60-second round — breaking through creative blocks with speed and constraint.

## What it does

- Guides users through 8 timed, 60-second ideation rounds
- Plays audio cues (beeps + synthesized voice coaching) at the start of each round and at the 10-second warning
- Displays a circular countdown timer with round progress
- Voice coaching prompts a different creative angle each round (e.g. "What would a child draw?", "Flip the problem around")
- Pause/resume and voice-toggle controls
- Closes with a reflection prompt to help identify the strongest idea

## Files

| File | Purpose |
|------|---------|
| `crazy_eight_minimal.html` | Main app shell and markup |
| `crazy_eight.css` | Styling — dark theme, Space Mono + Bebas Neue fonts |
| `crazy_eight.js` | Timer logic, Web Audio API cues, state machine |

## How to run

Open `crazy_eight_minimal.html` in any modern browser — no build step or server required.

## The exercise

1. Fold a sheet of paper into 8 panels (or use a sketchpad)
2. Click **Start Workout**
3. Sketch one idea per panel — don't lift your pen, don't overthink
4. When all 8 rounds finish, pick the idea that surprises you most

## Tech stack

- Vanilla HTML / CSS / JavaScript
- Web Audio API for synthesized sound cues
- No dependencies, no frameworks

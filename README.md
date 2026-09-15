# PulseSet — Workout Set Program Builder & Timer

A no-build, browser-only workout interval/program builder using HTML, CSS, and vanilla JavaScript.

## Run
Open `index.html` in a modern browser. For best local-file compatibility with ES modules and IndexedDB, serve the folder with any simple static server, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Included
- Dashboard, Set Programs, and Workout screens
- IndexedDB persistence
- Add / duplicate / delete / drag-reorder sets
- Per-set duration, break, midpoint beep, repetitions
- Fast repeated-set generator
- Visual program timeline
- Shared workout/preview timing engine based on `performance.now()` + `requestAnimationFrame`
- Web Audio API start/mid/end beeps with relative loudness hierarchy
- Pause-safe event state: pending scheduled beeps are cancelled; no paused beep fires; no retroactive midpoint beep
- Volume + mute controls
- Start / pause / resume / stop / restart / previous / next
- Responsive/mobile-focused workout screen
- No music, uploads, playlists, or audio editing

## Data
Programs remain in the browser's IndexedDB database `pulseset_db`. No backend is used.

# Liftlog – product spec (v1)

Decisions agreed with the owner, with the reference screenshots as the visual guide. Keep this file up to date when behaviour changes.

## Platform

- Web app, React + TypeScript + Vite. Mobile-first (phone browser), installable as a PWA, works offline.
- Data is saved on the device (IndexedDB via Dexie). Structured for cloud sync later. No export/import in v1; cloud storage comes later.
- Theme: dark and light, following the system by default, with a manual switch in Settings.
- Weight unit kg/lbs and distance km/miles, switchable. Stored internally as kg / km / seconds.

## Navigation

Bottom tabs: **Profile · History · Start Workout · Exercises · Settings** (Settings replaces the original app's Store tab).

## Start Workout tab

- "Start an Empty Workout" (named Morning / Afternoon / Evening / Night Workout by time of day).
- Templates: "+ Template", My Templates (n) as a 2-column card grid (name, ••• menu, exercise list, last used), Example Templates (6) that open a preview with Start Workout / Copy to My Templates.
- Template card ••• menu: Edit Template, Duplicate, Delete.
- Folders are not in v1.

## Active workout

- Opens as a sheet with a drag handle. Drag down (or tap the handle) to minimise to a bar above the tab bar; tap the bar to reopen.
- Top bar: rest timer button (shows remaining time while running), elapsed time in the centre once scrolled, green Finish.
- Header: workout name with a ••• menu (Rename, Adjust Start Time), date, elapsed time.
- Each exercise: blue name (opens exercise details), blue link button (superset with the next exercise; tap again to unlink), ••• menu.
- ••• menu: Add Warm-up Sets (40% × 5, 60% × 3, 80% × 2 of the first working set, rounded to 2.5 kg / 5 lb), Update Rest Timers, Replace Exercise, Create Superset / Remove From Superset, Remove Exercise. Notes and Preferences are left out of v1.
- Columns: Set · Previous · weight · Reps · ✓ (changes by exercise type: reps only, distance + time, time).
- Set number: tap to choose Normal / Warm-up (W) / Drop (D) / Failure (F).
- Previous: last workout's matching set (warm-ups match warm-ups, working sets match working sets). Tap to copy it in. Shown in white when the row is still empty.
- Empty weight/reps boxes show grey placeholders from Previous (or the set above). Ticking an empty set fills in the placeholders; if there are none, the row shakes.
- Ticked set: whole row turns green, check turns bright green, boxes lose their background.
- Input uses a custom in-app keypad (digits, ., backspace, hide, −/+, Next/Done).
- Swipe a set left to delete it.
- Rest bar under every set shows that set's rest time. Tap it to change that set's rest. After ticking a set its bar fills blue and counts down; tapping the running bar outlines it and opens the rest panel (Pause/Resume, −/+ 15s, Reset, Skip, hide). Sound + vibration when rest ends.
- In a superset the rest timer only starts after the last exercise of the group.
- "+ Add Set (1:30)" shows the rest the new set will get.
- Add Exercises (blue), Cancel Workout (red, with confirmation).
- New personal records show a gold trophy next to the set.

## Finish flow

1. If there are unticked sets with values: "Finish Workout?" dialog with 🎉 – Complete Unfinished Sets / Discard Unfinished Sets / Cancel. Empty or invalid sets are always removed.
2. Summary screen: falling stars, "Congratulations!" (or similar), "That's your Nth workout!", card with duration, volume, PRs, and the best set per exercise. Close with ✕. No share button in v1.
3. If the workout came from a template and changed: "Update Template" dialog over the summary – Update Values Only ("Updates values for N sets."), Update Template and Values (lists structural changes, e.g. "Removes 1 set. Updates rest timers."), Keep Original Template.

## History tab

- "Calendar" button, workouts grouped by month, cards like the summary card with a ••• menu: Edit Workout, Save as Template, Delete. Tap a card for full details.
- Calendar sheet: Monday-first, workout days dark with a green check, today white, future days grey. Tap a day to jump to that workout.

## Exercises tab

- New (custom exercise), search, Any Body Part / Any Category filters, sort (Name, Frequency, Last Performed), A–Z sections and an A–Z index.
- Simple muscle-based clipart icons (body outline with the target muscle highlighted), drawn in-app.
- About 115 built-in exercises. Exercise types: weight × reps, weighted/assisted bodyweight, reps only, cardio (distance + time), duration.
- Exercise details: History, Charts (estimated 1RM, heaviest weight, volume, etc.), Records. Custom exercises can be edited or deleted (archived so history keeps the name).

## Profile tab

- Ruler icon → Measurements (body weight, body fat %) with a chart and entry list.
- Name + photo (editable) and workout count.
- Dashboard with "+ Widget": Workouts Per Week (default; target button sets a weekly goal shown as a line), Volume Per Week, Exercise 1RM, Exercise Best Set, Exercise Volume, Body Weight, Body Fat. Widgets can be removed.

## Settings tab

Units (kg/lbs, km/miles), default rest timer, theme (System / Dark / Light), Reset All Data (with confirmation).

## Personal records

Based on prior workouts, warm-ups excluded, and only for exercises done before: heaviest weight, best estimated 1RM (Epley), best set volume; reps for reps-only, duration for timed, distance/duration for cardio.

## Hosting and workflow

- Every update goes on a new feature branch, then into `main`.
- GitHub Pages redeploys on every push to `main` (preview).
- Netlify is the main public site and only updates when a `v*` release tag is pushed.

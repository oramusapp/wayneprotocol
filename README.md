# The Wayne Protocol

30 days, one goal, in the style of Bruce Wayne. It runs in Fortislly as an admin-only app, served by the `api/wayne/` gate straight from the `main` branch of this repository.

## Flow
1. **Cut-off**: "Have you ghosted everyone, muted your groups and deleted social media?"
   - **No** → "Come back and repeat when you have done it."
   - **Yes** → next step.
   - Disclaimer: if you use social media for work, delete it right after the task.
2. **Skills**: one main skill (100%) and one side skill for 30 days.
3. **Non-negotiable rules**: 1–7 checkable rules.
4. **Alter ego**: a name and exactly 3 rules it lives by.
5. **Suit**: what you put on or do to step into the alter ego.
6. **Oath**: the 30 days start.

## During the 30 days
Everything set at the start stays visible for all 30 days.
- **Daily report**: kept the rules / broke a rule. A failure opens the Batman-style failure log:
  - time;
  - place;
  - feeling;
  - sequence of actions;
  - what temporary relief or pleasure the failure gave;
  - what I will do next time.
- **30-day grid**: shows the streak, kept days and failures.
- **Journal**: free reflections and failure entries.
- **Bat-Signal**: for a moment of temptation. It shows the alter ego's rules, the rules and the suit, and runs a 10-minute delay.
- **Day 31**: a summary with stats and a yes/no question: "Did you succeed?". The suggested threshold is 24 of 30 days. Add notes, then the month goes to history and a new one starts, pre-filled with the previous settings.
- **History**: every finished or aborted month, read-only.
- **Backup**: export or import a JSON file.

## Technical
- Plain HTML, CSS and JS with no build step: `index.html`, `assets/style.css`, `assets/app.js`.
- Data stays only in the browser, in localStorage under `wp.state`.

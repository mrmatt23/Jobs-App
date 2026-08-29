# Jobs

A jobs board for the crew — not a management dashboard.

Open a job, see who is on it, what kind of work they are doing, and watch the **tower** go up as the work actually gets done. The building is the job. When framing, electrical, plumbing, and the rest move, the floors go in.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm test
npm run build
```

## What you get

- **Live site view** — techs walk the yard, climb scaffold, and place work. Each place advances the task, and the tower follows the job.
- **Crew roster** — name, trade, current action, and task bar. Click a tech for break / job assignment.
- **Jobs rail** — switch jobs; each has its own tower and progress.
- **Add work** — new job, tech, or task, including the kind of work (foundation, framing, electrical, and so on).
- **Export / import** — the board lives in this browser (`localStorage`). Download JSON if you want a copy.

Hold shift pauses the site. 1x / 2x / 4x is only for watching a shift faster — it does not change how work is counted.

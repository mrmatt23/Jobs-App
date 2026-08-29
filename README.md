# Jobs

A jobs board for the crew — not a management dashboard.

Open a job, see who is on it, what kind of work they are doing, and watch the **tower** go up as the work actually gets done. The building is the job.

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

## What activity it shows

**This device (default):** processes actually running on the machine that serves the dashboard. Cloud agent, Vite, Cursor runtime, git, and shell commands show up as crew on the tower and refresh every few seconds. Run `npm run dev` on your laptop after cloning and this view is *your* machine.

**Jobsite jobs** (Harborview, Oakridge, anything you add): live crew actions as they place work — framing, electrical, plumbing, HVAC, roofing, finishing, inspection, materials.

**Jobs-App (this GitHub repo):** AI and GitHub, not a fake jobsite log.

| Who | What |
| --- | --- |
| **Grok 4.6** (`cursor-grok-4.6-high`) | Coding this dashboard. Commits from Cursor Agent map to Grok. |
| **Claude** | Debug / Claude Code sessions. Idle unless that work is on the repo. |
| **GrokBot** | Research (Omarchy / desktop). Idle unless that work is on the repo. |
| **Matt** | Human review. Your GitHub commits. |

The **GitHub + AI** feed pulls real commits and open PRs from `mrmatt23/Jobs-App` about every 45s. Click a line to open it on GitHub. That project's tower follows those commits.

The board cannot read Cursor Cloud's private agent API from the browser. It can show GitHub, plus the AI names above.

## Also

- Crew roster, job rail, add job/tech/task, export/import.
- Hold shift pauses the site. 1x / 2x / 4x only changes watch speed.

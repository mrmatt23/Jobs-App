import { useRef } from "react";
import { AgentRoster } from "./AgentRoster";
import { ActivityFeed } from "./ActivityFeed";
import { Composer } from "./Composer";
import { ProjectRail } from "./ProjectRail";
import { SiteScene } from "./SiteScene";
import { WORK_KIND_META } from "../types";
import type { JobSiteApi } from "../useJobSite";

export function Dashboard({ api }: { api: JobSiteApi }) {
  const project = api.selectedProject;
  const progress = project ? (api.progressByProject[project.id] ?? 0) : 0;
  const working = api.state.agents.filter(
    (agent) => agent.projectId === project?.id && agent.status === "working",
  ).length;
  const idle = api.state.agents.filter(
    (agent) => agent.projectId === project?.id && agent.status !== "working",
  ).length;
  const fileRef = useRef<HTMLInputElement>(null);

  if (!project) {
    return (
      <main className="shell">
        <p className="empty">No jobs yet.</p>
        <Composer api={api} />
      </main>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">
              {project.source === "github" ? "Jobs · GitHub live" : "Jobs · for the crew"}
            </p>
            <h1>{project.name}</h1>
            <p className="site-line">{project.site}</p>
          </div>
        </div>
        <dl className="stats">
          <div>
            <dt>Built</dt>
            <dd>{Math.round(progress)}%</dd>
          </div>
          <div>
            <dt>On tools</dt>
            <dd>{working}</dd>
          </div>
          <div>
            <dt>Standing by</dt>
            <dd>{idle}</dd>
          </div>
          <div>
            <dt>Levels</dt>
            <dd>
              {project.floors}
            </dd>
          </div>
        </dl>
        <div className="top-actions">
          <button
            type="button"
            className={api.state.paused ? "primary" : ""}
            onClick={() => api.setPaused(!api.state.paused)}
          >
            {api.state.paused ? "Resume shift" : "Hold shift"}
          </button>
          <div className="speed" role="group" aria-label="Time scale">
            {([1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                className={api.state.speed === speed ? "is-active" : ""}
                onClick={() => api.setSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="layout">
        <div className="stage">
          <SiteScene sceneRef={api.sceneRef} onSelectAgent={api.setSelectedAgentId} />
          <div className="legend">
            {Object.entries(WORK_KIND_META)
              .filter(([kind]) =>
                api.selectedTasks.some((task: { workKind: string }) => task.workKind === kind),
              )
              .map(([kind, meta]) => (
              <span key={kind}>
                <i style={{ background: meta.hue }} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>
        <aside className="side">
          <AgentRoster api={api} />
          <ActivityFeed api={api} />
        </aside>
      </div>

      <footer className="bottom">
        <ProjectRail api={api} />
        <div className="bottom-tools">
          <Composer api={api} />
          <button type="button" onClick={api.download}>
            Export
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) api.upload(file);
              event.target.value = "";
            }}
          />
          <button type="button" className="danger" onClick={api.reset}>
            Reset demo
          </button>
        </div>
      </footer>
    </div>
  );
}

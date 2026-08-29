import { useState } from "react";
import type { WorkKind } from "../types";
import { WORK_KIND_META, WORK_KINDS } from "../types";
import type { JobSiteApi } from "../useJobSite";

type Tab = "job" | "tech" | "task";

export function Composer({ api }: { api: JobSiteApi }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("job");

  return (
    <div className="composer">
      <button type="button" className="primary" onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : "Add work"}
      </button>
      {open ? (
        <div className="composer-card">
          <div className="tabs" role="tablist">
            {(["job", "tech", "task"] as Tab[]).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? "is-active" : ""}
                onClick={() => setTab(item)}
              >
                {item === "job" ? "Job" : item === "tech" ? "Tech" : "Task"}
              </button>
            ))}
          </div>
          {tab === "job" ? <JobForm api={api} onDone={() => setOpen(false)} /> : null}
          {tab === "tech" ? <TechForm api={api} onDone={() => setOpen(false)} /> : null}
          {tab === "task" ? <TaskForm api={api} onDone={() => setOpen(false)} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function JobForm({ api, onDone }: { api: JobSiteApi; onDone: () => void }) {
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [floors, setFloors] = useState(4);

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        api.createJob({ name, site, floors });
        onDone();
      }}
    >
      <label>
        Job name
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="West dock rebuild" />
      </label>
      <label>
        Site
        <input value={site} onChange={(event) => setSite(event.target.value)} placeholder="400 Industrial" />
      </label>
      <label>
        Levels in this job
        <input
          type="number"
          min={1}
          max={20}
          step={1}
          value={floors}
          onChange={(event) => setFloors(Number(event.target.value))}
        />
        <small>A shed can be 2. A tower can be 12. Anything from 1–20.</small>
      </label>
      <button type="submit" className="primary">
        Open job
      </button>
    </form>
  );
}

function TechForm({ api, onDone }: { api: JobSiteApi; onDone: () => void }) {
  const [name, setName] = useState("");
  const [trade, setTrade] = useState<WorkKind>("framing");
  const [projectId, setProjectId] = useState(api.selectedProject?.id ?? "");

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        api.createAgent({ name, trade, projectId: projectId || null });
        onDone();
      }}
    >
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Alex Rivera" />
      </label>
      <label>
        Trade
        <select value={trade} onChange={(event) => setTrade(event.target.value as WorkKind)}>
          {WORK_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {WORK_KIND_META[kind].label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Job
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="">Unassigned</option>
          {api.state.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary">
        Add to crew
      </button>
    </form>
  );
}

function TaskForm({ api, onDone }: { api: JobSiteApi; onDone: () => void }) {
  const project = api.selectedProject;
  const [title, setTitle] = useState("");
  const [workKind, setWorkKind] = useState<WorkKind>("framing");
  const [floor, setFloor] = useState(1);
  const [assigneeId, setAssigneeId] = useState("");

  if (!project) return <p className="empty">Pick a job first.</p>;

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        api.createTask({
          projectId: project.id,
          title,
          workKind,
          floor,
          assigneeId: assigneeId || null,
        });
        onDone();
      }}
    >
      <label>
        What needs doing
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Pull homeruns on 4"
        />
      </label>
      <label>
        Kind of work
        <select value={workKind} onChange={(event) => setWorkKind(event.target.value as WorkKind)}>
          {WORK_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {WORK_KIND_META[kind].label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Level
        <input
          type="number"
          min={1}
          max={project.floors}
          value={floor}
          onChange={(event) => setFloor(Number(event.target.value))}
        />
      </label>
      <label>
        Assign
        <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
          <option value="">Next available</option>
          {api.state.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} · {WORK_KIND_META[agent.trade].label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary">
        Put it on the board
      </button>
    </form>
  );
}

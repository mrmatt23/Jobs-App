import type { JobSiteApi } from "../useJobSite";
import { WORK_KIND_META } from "../types";

export function AgentRoster({ api }: { api: JobSiteApi }) {
  const { state, selectedProject, selectedAgentId, setSelectedAgentId, actionFor } = api;

  const onSite = state.agents.filter((agent) => agent.projectId === selectedProject?.id);
  const offSite = state.agents.filter((agent) => agent.projectId !== selectedProject?.id);

  return (
    <section className="panel roster">
      <header className="panel-head">
        <h2>Crew</h2>
        <span className="count">{state.agents.length}</span>
      </header>
      <ul className="agent-list">
        {onSite.map((agent) => {
          const task = state.tasks.find((item) => item.id === agent.taskId);
          const active = selectedAgentId === agent.id;
          return (
            <li key={agent.id}>
              <button
                type="button"
                className={`agent-card ${active ? "is-active" : ""}`}
                onClick={() => setSelectedAgentId(active ? null : agent.id)}
              >
                <span className="agent-swatch" style={{ background: agent.color }} />
                <span className="agent-copy">
                  <strong>{agent.name}</strong>
                  <em>
                    {task
                      ? `${WORK_KIND_META[task.workKind].label} · L${task.floor}`
                      : WORK_KIND_META[agent.trade].label}
                  </em>
                  <span className={`status status-${agent.status}`}>{actionFor(agent.id)}</span>
                </span>
                {task ? (
                  <span className="mini-bar" aria-label={`${Math.round(task.progress)}%`}>
                    <span style={{ width: `${task.progress}%`, background: agent.color }} />
                  </span>
                ) : null}
              </button>
              {active ? (
                <div className="agent-actions">
                  <button type="button" onClick={() => api.toggleBreak(agent.id)}>
                    {agent.status === "break" ? "Back on tools" : "Send on break"}
                  </button>
                  <label>
                    Job
                    <select
                      value={agent.projectId ?? ""}
                      onChange={(event) =>
                        api.moveAgent(agent.id, event.target.value || null)
                      }
                    >
                      <option value="">Unassigned</option>
                      {state.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {offSite.length > 0 ? (
        <>
          <h3 className="subhead">Off this site</h3>
          <ul className="agent-list compact">
            {offSite.map((agent) => {
              const project = state.projects.find((item) => item.id === agent.projectId);
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    className="agent-card"
                    onClick={() => setSelectedAgentId(agent.id)}
                  >
                    <span className="agent-swatch" style={{ background: agent.color }} />
                    <span className="agent-copy">
                      <strong>{agent.name}</strong>
                      <em>
                        {WORK_KIND_META[agent.trade].label}
                        {project ? ` · ${project.name}` : " · unassigned"}
                      </em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}

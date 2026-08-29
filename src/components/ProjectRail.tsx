import type { JobSiteApi } from "../useJobSite";

export function ProjectRail({ api }: { api: JobSiteApi }) {
  const { state, progressByProject, selectProject, selectedProject } = api;

  return (
    <section className="project-rail" aria-label="Jobs">
      {state.projects.map((project) => {
        const progress = progressByProject[project.id] ?? 0;
        const active = selectedProject?.id === project.id;
        const crew = state.agents.filter((agent) => agent.projectId === project.id).length;
        return (
          <button
            key={project.id}
            type="button"
            className={`job-chip ${active ? "is-active" : ""}`}
            onClick={() => selectProject(project.id)}
          >
            <span className="job-chip-name">{project.name}</span>
            <span className="job-chip-meta">
              {project.site} · {crew} techs
            </span>
            <span className="job-chip-bar">
              <span style={{ width: `${progress}%` }} />
            </span>
            <span className="job-chip-pct">{Math.round(progress)}%</span>
          </button>
        );
      })}
    </section>
  );
}

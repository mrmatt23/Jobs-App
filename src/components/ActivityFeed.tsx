import type { JobSiteApi } from "../useJobSite";

export function ActivityFeed({ api }: { api: JobSiteApi }) {
  const events = api.state.activity.filter(
    (event) => event.projectId === api.selectedProject?.id,
  );
  const liveGithub = api.selectedProject?.source === "github";
  const liveDevice = api.selectedProject?.source === "device";
  const live = liveGithub || liveDevice;
  const sync = liveDevice ? api.deviceStatus : api.githubStatus;

  return (
    <section className="panel feed">
      <header className="panel-head">
        <h2>{liveDevice ? "This device" : liveGithub ? "GitHub + AI" : "On the tools"}</h2>
        {live ? (
          <span className={`count sync-${sync}`}>
            {sync === "live" ? "live" : sync === "loading" ? "scanning" : "offline"}
          </span>
        ) : null}
      </header>
      <ol className="feed-list">
        {events.length === 0 ? <li className="empty">Quiet so far this shift.</li> : null}
        {events.slice(0, 12).map((event) => {
          const agent = api.state.agents.find((item) => item.id === event.agentId);
          const body = (
            <>
              <span className="dot" style={{ background: agent?.color ?? "#f0a202" }} />
              <span>
                {agent?.model ? <b className="model-tag">{agent.model}</b> : null}
                {event.text}
              </span>
              <time>
                {new Date(event.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </>
          );
          return (
            <li key={event.id}>
              {event.url ? (
                <a href={event.url} target="_blank" rel="noreferrer" className="feed-link">
                  {body}
                </a>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

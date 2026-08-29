import type { JobSiteApi } from "../useJobSite";

export function ActivityFeed({ api }: { api: JobSiteApi }) {
  const events = api.state.activity.filter(
    (event) => event.projectId === api.selectedProject?.id,
  );

  return (
    <section className="panel feed">
      <header className="panel-head">
        <h2>On the tools</h2>
      </header>
      <ol className="feed-list">
        {events.length === 0 ? <li className="empty">Quiet so far this shift.</li> : null}
        {events.slice(0, 12).map((event) => {
          const agent = api.state.agents.find((item) => item.id === event.agentId);
          return (
            <li key={event.id}>
              <span className="dot" style={{ background: agent?.color ?? "#f0a202" }} />
              <span>{event.text}</span>
              <time>
                {new Date(event.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

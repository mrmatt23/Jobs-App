import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fetchGithubSnapshot } from "../src/github";
import { buildGithubLiveFeed, liveFeedSignature, type PulseFeed } from "../src/live";

const OUT = "live.json";

function existingCore(): string | null {
  if (!existsSync(OUT)) return null;
  try {
    const parsed = JSON.parse(readFileSync(OUT, "utf8")) as PulseFeed;
    return liveFeedSignature(parsed);
  } catch {
    return null;
  }
}

const snapshot = await fetchGithubSnapshot();
const feed = buildGithubLiveFeed(snapshot);
const next = `${JSON.stringify(feed, null, 2)}\n`;
const prior = existingCore();
if (prior === liveFeedSignature(feed) && existsSync(OUT)) {
  process.stdout.write("live.json unchanged (GitHub activity same)\n");
  process.exit(0);
}
writeFileSync(OUT, next);
process.stdout.write(`wrote ${OUT} (${feed.agents.length} agents, ${feed.handoffs.length} handoffs)\n`);

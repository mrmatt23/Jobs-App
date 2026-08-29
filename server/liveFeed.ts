import { scanDevice } from "./scanDevice";
import { applyDeviceSnapshot } from "../src/device";
import { applyGithubSnapshot, fetchGithubSnapshot, type GithubSnapshot } from "../src/github";
import { assembleLiveFeed, type PulseFeed } from "../src/live";
import { createSeedState } from "../src/seed";

const GITHUB_TTL_MS = 45_000;

let githubCache: { at: number; snapshot: GithubSnapshot | null } = { at: 0, snapshot: null };

async function githubSnapshot(): Promise<GithubSnapshot | null> {
  if (githubCache.snapshot && Date.now() - githubCache.at < GITHUB_TTL_MS) {
    return githubCache.snapshot;
  }
  try {
    const snapshot = await fetchGithubSnapshot();
    githubCache = { at: Date.now(), snapshot };
    return snapshot;
  } catch {
    return githubCache.snapshot;
  }
}

export async function buildLiveFeed(): Promise<PulseFeed> {
  const device = scanDevice(process.cwd());
  const github = await githubSnapshot();
  let state = applyDeviceSnapshot(createSeedState(), device);
  if (github) state = applyGithubSnapshot(state, github);
  return assembleLiveFeed(state, github?.pulls ?? []);
}

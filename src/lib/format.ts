export function pad(n: number, size = 2): string {
  return String(Math.floor(n)).padStart(size, "0");
}

export function formatClock(ts: number): { time: string; date: string; zone: string } {
  const d = new Date(ts);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date = d
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();
  return { time, date, zone: "LUMEN / PST" };
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

export function brightnessPct(brightness: unknown): number {
  return Math.round((asNumber(brightness, 0) / 255) * 100);
}

export function titleState(state: string): string {
  return state
    .replace(/_/g, " ")
    .replace(/cloudy/gi, " cloudy")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

import assert from "node:assert/strict";

// Run against a local production server with Supabase unset.
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const cookies = new Map();
let checks = 0;

async function request(path, { method = "GET", body, isolated = false, raw = false } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(!isolated && cookies.size ? { Cookie: [...cookies].map(([key, value]) => key + "=" + value).join("; ") } : {}),
    },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    redirect: "manual",
  });
  if (!isolated) for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  const content = await response.text();
  return { response, json: response.headers.get("content-type")?.includes("json") ? JSON.parse(content) : null, content };
}

function check(condition, message) {
  assert.ok(condition, message);
  checks++;
  console.log("PASS", message);
}

const initial = await request("/api/spaces");
assert.equal(initial.json?.source, "mock_demo", "Refusing to mutate a configured database. Use an unconfigured demo server.");
check(initial.response.status === 200 && initial.json.data.length === 6, "six spaces load");
const baseline = new Map(initial.json.data.map((space) => [space.id, space.occupied]));

for (const path of ["/", "/map", "/spaces", "/spaces/study-room-c", "/recommendation", "/reservations", "/notifications", "/profile", "/privacy", "/demo", "/admin", "/login", "/signup", "/forgot-password", "/reset-password"]) {
  const page = await request(path);
  check(page.response.status === 200 && page.content.includes("CampusPulse"), "page " + path);
}
check((await request("/does-not-exist")).response.status === 404, "unknown page returns 404");
check((await request("/api/spaces/missing")).response.status === 404, "unknown space returns 404");

for (const [path, body] of [
  ["/api/occupancy/update", { spaceId: "study-room-c", occupied: -2 }],
  ["/api/recommendation", { maxWalkMinutes: -1 }],
  ["/api/simulator/scenario", { scenario: "unknown" }],
  ["/api/reservations", {}],
  ["/api/alerts", {}],
]) {
  check((await request(path, { method: "POST", body })).response.status === 400, "invalid input rejected: " + path);
}
check((await request("/api/recommendation", { method: "POST", body: "{broken", raw: true })).response.status === 400, "malformed JSON returns 400");

const changed = await request("/api/occupancy/update", { method: "POST", body: { spaceId: "study-room-c", occupied: 27 } });
check(changed.response.ok, "manual occupancy update");
const spaces = await request("/api/spaces");
const study = spaces.json.data.find((space) => space.id === "study-room-c");
check(study.occupied === 27 && study.status === "crowded", "occupancy persists across requests with consistent status");
const detail = await request("/api/spaces/study-room-c");
check(detail.json.data.occupied === 27, "detail endpoint uses updated occupancy");
const separate = await request("/api/spaces", { isolated: true });
check(separate.json.data.find((space) => space.id === "study-room-c").occupied === baseline.get("study-room-c"), "separate demo visitors are isolated");

const started = await request("/api/simulator/start", { method: "POST", body: { scenario: "lunch_rush", frequencySeconds: 2 } });
check(started.json.status.isRunning && !started.json.status.serverIntervalActive, "serverless start does not depend on a background timer");
const tick = await request("/api/simulator/tick", { method: "POST" });
check(tick.json.status.totalTicks > 0 && tick.json.status.recentEvents.length > 0, "tick generates occupancy and sensor events");
const status = await request("/api/simulator/status");
check(status.json.status.scenario === "lunch_rush" && status.json.status.totalTicks === tick.json.status.totalTicks, "simulator status persists between endpoints");
const stopped = await request("/api/simulator/stop", { method: "POST" });
check(!stopped.json.status.isRunning, "simulator stop");
for (const scenario of ["exam_surge", "lab_release", "event_exit", "normal"]) {
  const result = await request("/api/simulator/scenario", { method: "POST", body: { scenario } });
  check(result.response.ok && result.json.status.scenario === scenario, "scenario " + scenario);
}
const recommendations = await request("/api/recommendation", { method: "POST", body: { spaceTypes: ["canteen"], maxWalkMinutes: 10 } });
check(recommendations.json.recommendations.length > 0 && recommendations.json.recommendations.every((item) => item.space.type === "canteen"), "dining recommendations contain dining spaces");
const impossible = await request("/api/recommendation", { method: "POST", body: { maxWalkMinutes: 1 } });
check(impossible.json.recommendations.length === 0, "impossible filters produce empty results");
const preview = await request("/api/simulator/insights", { method: "POST", body: {
  insightId: "qa-preview", spaceId: "seminar-hall-a", spaceName: "Seminar Hall A",
  suggestedAction: "Preview overflow capacity", previewOnly: true,
} });
check(preview.json.source === "demo_preview", "advisory remains an explicit preview");
await request("/api/simulator/reset", { method: "POST" });
const reset = await request("/api/spaces");
check(reset.json.data.every((space) => space.occupied === baseline.get(space.id)), "reset restores all baseline occupancies");
const resetStatus = await request("/api/simulator/status");
check(resetStatus.json.status.totalTicks === 0 && !resetStatus.json.status.isRunning, "reset clears simulator state");
console.log("Completed " + checks + " checks.");

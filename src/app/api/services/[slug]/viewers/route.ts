import { NextResponse } from "next/server";

/**
 * GET /api/services/[slug]/viewers
 * Returns an HONEST count of unique viewers of this service in the last
 * 5 minutes. Uses an in-memory Map (reset on server restart). Each viewer
 * is identified by a hash of their IP + user-agent — anonymous, not stored.
 *
 * This is real social proof: "۳ نفر در حال مشاهده این سرویس" means 3
 * actual humans looked at this page in the last 5 minutes. Not fake.
 */

// Map<slug, Map<viewerHash, lastSeenTimestamp>>
const viewers = new Map<string, Map<string, number>>();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup stale entries every 60s to avoid unbounded growth
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [slug, map] of viewers) {
    for (const [hash, ts] of map) {
      if (now - ts > WINDOW_MS) map.delete(hash);
    }
    if (map.size === 0) viewers.delete(slug);
  }
}

function hash(s: string): string {
  // Simple FNV-1a hash — not cryptographic, just for dedup
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  cleanup();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const viewerHash = hash(`${ip}:${ua}`);

  // Register this viewer
  let map = viewers.get(slug);
  if (!map) {
    map = new Map();
    viewers.set(slug, map);
  }
  map.set(viewerHash, Date.now());

  // Count active viewers (including this one)
  const count = map.size;

  return NextResponse.json({
    viewers: count,
    window: "5min",
  });
}

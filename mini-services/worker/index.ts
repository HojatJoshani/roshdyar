/**
 * Roshdyar background worker — a standalone Bun service.
 *
 * Polls the Next.js app's /api/worker endpoint every 5s to:
 *   1. Pick up PAYMENT_CONFIRMED orders, call the provider to place them,
 *      and report back ("placed").
 *   2. Poll status of PROCESSING/IN_PROGRESS orders from the provider and
 *      report back ("status"). On PARTIAL/FAILED, the app handles refunding.
 *
 * Why a separate process?
 *   - Never block the request/response cycle on a provider call.
 *   - Survives app restarts (the worker keeps running).
 *   - Easy to scale independently later.
 *
 * The provider adapter is re-implemented here (mock) so the worker doesn't
 * need to import Prisma etc. — it talks purely over HTTP to the app's API.
 */

const PORT = 3003;
const APP_BASE = process.env.APP_BASE ?? "http://localhost:3000";
const WORKER_KEY = process.env.WORKER_KEY ?? "dev-worker-key";
const POLL_INTERVAL_MS = 5000;

// ---------- Mock provider (mirror of src/lib/provider/adapter.ts mock) ----------
import { promises as fs } from "fs";
import path from "path";

const STATE_FILE = path.resolve(
  process.env.PROVIDER_STATE_FILE ??
    "/home/z/my-project/mock-provider-state.json"
);

type MockState = Record<
  string,
  {
    providerOrderId: string;
    providerServiceId: string;
    link: string;
    quantity: number;
    startedCount: number;
    remainsCount: number;
    completedCount: number;
    status: "pending" | "in_progress" | "completed" | "partial" | "failed";
    createdAt: number;
    willPartial: boolean;
    willFail: boolean;
    finishAt: number;
  }
>;

async function readState(): Promise<MockState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function writeState(s: MockState) {
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2), "utf-8");
}
function makeId(): string {
  return "MOCK-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function placeOrder(input: {
  providerServiceId: string;
  link: string;
  quantity: number;
}) {
  const state = await readState();
  const id = makeId();
  const qty = Math.max(1, Math.floor(input.quantity));
  const willPartial = Math.random() < 0.08;
  const willFail = Math.random() < 0.03;
  const finishAt = Date.now() + (30 + Math.floor(Math.random() * 60)) * 1000;
  state[id] = {
    providerOrderId: id,
    providerServiceId: input.providerServiceId,
    link: input.link,
    quantity: qty,
    startedCount: 0,
    remainsCount: qty,
    completedCount: 0,
    status: "pending",
    createdAt: Date.now(),
    willPartial,
    willFail,
    finishAt,
  };
  await writeState(state);
  return { providerOrderId: id, startedCount: 0, remainsCount: qty };
}

async function getStatus(providerOrderId: string) {
  const state = await readState();
  const o = state[providerOrderId];
  if (!o) {
    return {
      status: "failed" as const,
      startedCount: 0,
      remainsCount: 0,
      completedCount: 0,
    };
  }
  const now = Date.now();
  const total = o.finishAt - o.createdAt;
  const elapsed = Math.min(now - o.createdAt, total);
  const pct = total > 0 ? elapsed / total : 1;

  if (pct >= 1) {
    if (o.willFail) {
      o.status = "failed";
      o.completedCount = Math.floor(o.quantity * 0.1);
      o.remainsCount = o.quantity - o.completedCount;
    } else if (o.willPartial) {
      o.status = "partial";
      const factor = 0.75 + Math.random() * 0.2;
      o.completedCount = Math.floor(o.quantity * factor);
      o.remainsCount = o.quantity - o.completedCount;
      o.startedCount = o.quantity;
    } else {
      o.status = "completed";
      o.completedCount = o.quantity;
      o.remainsCount = 0;
      o.startedCount = o.quantity;
    }
  } else if (pct > 0.05) {
    o.status = "in_progress";
    o.completedCount = Math.floor(o.quantity * pct);
    o.remainsCount = o.quantity - o.completedCount;
    o.startedCount = o.quantity;
  }
  await writeState(state);
  return {
    status: o.status,
    startedCount: o.startedCount,
    remainsCount: o.remainsCount,
    completedCount: o.completedCount,
  };
}

// ---------- HTTP helpers ----------
async function fetchPending() {
  const r = await fetch(`${APP_BASE}/api/worker`, {
    headers: { "x-worker-key": WORKER_KEY },
  });
  if (!r.ok) throw new Error(`worker fetch failed: ${r.status}`);
  return r.json();
}

async function reportPlaced(payload: any) {
  const r = await fetch(`${APP_BASE}/api/worker`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-key": WORKER_KEY,
    },
    body: JSON.stringify({ action: "placed", ...payload }),
  });
  if (!r.ok) throw new Error(`worker report placed failed: ${r.status}`);
  return r.json();
}

async function reportStatus(payload: any) {
  const r = await fetch(`${APP_BASE}/api/worker`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-key": WORKER_KEY,
    },
    body: JSON.stringify({ action: "status", ...payload }),
  });
  if (!r.ok) throw new Error(`worker report status failed: ${r.status}`);
  return r.json();
}

// ---------- Main loop ----------
async function tick() {
  try {
    const data: any = await fetchPending();

    // 1. Place pending orders
    for (const o of data.toPlace ?? []) {
      try {
        const res = await placeOrder({
          providerServiceId: o.providerServiceId,
          link: o.targetLink,
          quantity: o.quantity,
        });
        await reportPlaced({
          orderId: o.id,
          userId: o.userId,
          providerOrderId: res.providerOrderId,
          startedCount: res.startedCount,
          remainsCount: res.remainsCount,
        });
        console.log(
          `[worker] placed order ${o.code} -> providerOrderId ${res.providerOrderId}`
        );
      } catch (e: any) {
        console.error(`[worker] placeOrder failed for ${o.code}:`, e?.message);
      }
    }

    // 2. Poll status of in-progress orders
    for (const o of data.toPoll ?? []) {
      try {
        const s = await getStatus(o.providerOrderId);
        const msg =
          s.status === "in_progress"
            ? `در حال اجرا — ${s.completedCount} از ${o.quantity} انجام شد.`
            : s.status === "completed"
            ? `سفارش تکمیل شد — ${s.completedCount} مورد تحویل داده شد.`
            : s.status === "partial"
            ? `تحویل ناقص — ${s.completedCount} از ${o.quantity} انجام شد. مابه‌التفاوت بازگردانده می‌شود.`
            : s.status === "failed"
            ? `سفارش ناموفق بود — ${s.completedCount} مورد تحویل داده شد. مبلغ بازگردانده می‌شود.`
            : "در حال پردازش...";
        await reportStatus({
          orderId: o.id,
          userId: o.userId,
          status: s.status,
          startedCount: s.startedCount,
          remainsCount: s.remainsCount,
          completedCount: s.completedCount,
          message: msg,
        });
        console.log(
          `[worker] status ${o.code}: ${s.status} (${s.completedCount}/${o.quantity})`
        );
      } catch (e: any) {
        console.error(`[worker] getStatus failed for ${o.code}:`, e?.message);
      }
    }
  } catch (e: any) {
    console.error(`[worker] tick failed:`, e?.message);
  }
}

// Tiny health server so we know the worker is alive
const server = Bun.serve({
  port: PORT,
  fetch() {
    return new Response(
      JSON.stringify({ ok: true, lastTick: lastTickIso }),
      { headers: { "content-type": "application/json" } }
    );
  },
});
console.log(`[worker] health server on :${PORT}`);

let lastTickIso: string | null = null;
async function loop() {
  while (true) {
    lastTickIso = new Date().toISOString();
    await tick();
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}
loop();

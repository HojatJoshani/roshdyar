/**
 * Provider adapter pattern. The customer-facing UI never sees provider
 * details — only the curated local service/tier the customer bought.
 *
 * For the MVP we wire up exactly ONE provider: a deterministic "mock"
 * provider that simulates realistic provider behavior (creates orders,
 * progresses status over time, sometimes partial-completes).
 *
 * Adding a second provider later = implement ProviderAdapter and
 * register it in the provider registry.
 */

export interface PlaceOrderInput {
  providerServiceId: string;
  link: string;
  quantity: number;
}

export interface PlaceOrderResult {
  providerOrderId: string;
  startedCount: number;
  remainsCount: number;
  raw: Record<string, unknown>;
}

export interface ProviderOrderStatus {
  status: "pending" | "in_progress" | "completed" | "partial" | "failed";
  startedCount: number;
  remainsCount: number;
  completedCount: number;
  raw?: Record<string, unknown>;
}

export interface ProviderAdapter {
  key: string;
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  getStatus(providerOrderId: string): Promise<ProviderOrderStatus>;
}

// ----------------------- Mock provider -----------------------

/**
 * The mock provider persists its own "external" state in a JSON file on
 * disk so the background worker (a separate mini-service) can poll it.
 */
import { promises as fs } from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "mock-provider-state.json");

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
    status: ProviderOrderStatus["status"];
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

export const mockProvider: ProviderAdapter = {
  key: "mock",

  async placeOrder(input) {
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
    return {
      providerOrderId: id,
      startedCount: 0,
      remainsCount: qty,
      raw: { ok: 1, order: id },
    };
  },

  async getStatus(providerOrderId) {
    const state = await readState();
    const o = state[providerOrderId];
    if (!o) {
      return {
        status: "failed",
        startedCount: 0,
        remainsCount: 0,
        completedCount: 0,
        raw: { error: "not_found" },
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
      raw: { pct, finishAt: o.finishAt },
    };
  },
};

// ----------------------- Registry -----------------------

const providers: Record<string, ProviderAdapter> = {
  mock: mockProvider,
};

export function getProvider(key: string): ProviderAdapter {
  const p = providers[key];
  if (!p) throw new Error(`UNKNOWN_PROVIDER:${key}`);
  return p;
}

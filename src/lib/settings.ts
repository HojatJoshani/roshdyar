import { db } from "@/lib/db";

/**
 * Site-wide settings helper. Reads from the Setting table (key-value).
 * Returns typed defaults when a key is missing.
 *
 * Settings are cached per-request via a module-level Map to avoid
 * repeated DB hits within the same render.
 */

interface SettingsDefaults {
  "site.maintenanceMode": boolean;
  "site.maintenanceMessage": string;
  "site.defaultWalletCredit": number; // Toman, given to new users in dev
  "site.minOrderAmount": number; // Toman, minimum order total
  "site.maxOrderAmount": number; // Toman, maximum order total
}

const DEFAULTS: SettingsDefaults = {
  "site.maintenanceMode": false,
  "site.maintenanceMessage":
    "سایت در حال به‌روزرسانی است. لطفاً چند دقیقه دیگر تلاش کنید.",
  "site.defaultWalletCredit": 50000,
  "site.minOrderAmount": 1000,
  "site.maxOrderAmount": 50_000_000,
};

let cache: Map<string, string> | null = null;

async function loadCache() {
  if (cache) return cache;
  const rows = await db.setting.findMany();
  cache = new Map(rows.map((r) => [r.key, r.value]));
  return cache;
}

/** Invalidate the cache — call after writing settings. */
export function invalidateSettingsCache() {
  cache = null;
}

export async function getSetting<K extends keyof SettingsDefaults>(
  key: K
): Promise<SettingsDefaults[K]> {
  const c = await loadCache();
  const raw = c.get(key);
  if (raw === undefined) return DEFAULTS[key];
  const def = DEFAULTS[key];
  if (typeof def === "boolean") return (raw === "true") as SettingsDefaults[K];
  if (typeof def === "number") return Number(raw) as SettingsDefaults[K];
  return raw as SettingsDefaults[K];
}

export async function getAllSettings(): Promise<SettingsDefaults> {
  const c = await loadCache();
  const result = {} as SettingsDefaults;
  for (const key of Object.keys(DEFAULTS) as (keyof SettingsDefaults)[]) {
    const raw = c.get(key);
    if (raw === undefined) {
      result[key] = DEFAULTS[key];
    } else {
      const def = DEFAULTS[key];
      if (typeof def === "boolean")
        (result as any)[key] = raw === "true";
      else if (typeof def === "number")
        (result as any)[key] = Number(raw);
      else (result as any)[key] = raw;
    }
  }
  return result;
}

export async function setSetting<K extends keyof SettingsDefaults>(
  key: K,
  value: SettingsDefaults[K]
): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
  invalidateSettingsCache();
}

/** Check if maintenance mode is on — used by middleware/order creation. */
export async function isMaintenanceMode(): Promise<boolean> {
  return getSetting("site.maintenanceMode");
}

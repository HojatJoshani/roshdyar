import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAllSettings, setSetting } from "@/lib/settings";

const Body = z.object({
  "site.maintenanceMode": z.boolean().optional(),
  "site.maintenanceMessage": z.string().trim().max(500).optional(),
  "site.defaultWalletCredit": z.number().int().min(0).max(10_000_000).optional(),
  "site.minOrderAmount": z.number().int().min(0).max(10_000_000).optional(),
  "site.maxOrderAmount": z.number().int().min(0).max(1_000_000_000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const settings = await getAllSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const keys = Object.keys(body) as (keyof typeof body)[];
  for (const key of keys) {
    if (body[key] !== undefined) {
      await setSetting(key, body[key] as any);
    }
  }

  const settings = await getAllSettings();
  return NextResponse.json({ ok: true, settings });
}

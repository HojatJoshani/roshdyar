import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Body = z.object({
  // Tier fields
  name: z.string().trim().min(2).max(120).optional(),
  pricePer1000: z.number().int().nonnegative().max(10_000_000).optional(),
  minQuantity: z.number().int().positive().max(10_000_000).optional(),
  maxQuantity: z.number().int().positive().max(10_000_000).optional(),
  step: z.number().int().positive().max(1_000_000).optional(),
  deliveryEstimate: z.string().trim().min(2).max(120).optional(),
  refillPolicy: z.string().trim().min(2).max(240).optional(),
  refundPolicy: z.string().trim().min(2).max(240).optional(),
  isActive: z.boolean().optional(),
  displayName: z.string().trim().min(2).max(60).optional(),
  tagline: z.string().trim().min(2).max(120).optional(),
  featuresCsv: z.string().trim().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
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

  // Look up the tier first — the [id] could be either a service or a tier.
  // We prefer tier matches; if not found, treat as service and update isActive + name only.
  const tier = await db.serviceTier.findUnique({
    where: { id },
    select: { id: true, serviceId: true },
  });

  if (tier) {
    // Build tier update payload
    const tierUpdate: Record<string, unknown> = {};
    if (body.displayName !== undefined) tierUpdate.displayName = body.displayName;
    if (body.tagline !== undefined) tierUpdate.tagline = body.tagline;
    if (body.featuresCsv !== undefined) tierUpdate.featuresCsv = body.featuresCsv;
    if (body.pricePer1000 !== undefined) tierUpdate.pricePer1000 = body.pricePer1000;
    if (body.minQuantity !== undefined) tierUpdate.minQuantity = body.minQuantity;
    if (body.maxQuantity !== undefined) tierUpdate.maxQuantity = body.maxQuantity;
    if (body.step !== undefined) tierUpdate.step = body.step;
    if (body.deliveryEstimate !== undefined) tierUpdate.deliveryEstimate = body.deliveryEstimate;
    if (body.refillPolicy !== undefined) tierUpdate.refillPolicy = body.refillPolicy;
    if (body.refundPolicy !== undefined) tierUpdate.refundPolicy = body.refundPolicy;
    if (body.isActive !== undefined) tierUpdate.isActive = body.isActive;

    // Cross-field validation: min <= max
    if (
      body.minQuantity !== undefined &&
      body.maxQuantity !== undefined &&
      body.minQuantity > body.maxQuantity
    ) {
      return NextResponse.json(
        { error: "INVALID_RANGE", message: "حداقل تعداد نباید از حداکثر بیشتر باشد." },
        { status: 400 }
      );
    }

    const updated = await db.serviceTier.update({
      where: { id },
      data: tierUpdate,
      select: {
        id: true,
        tier: true,
        displayName: true,
        tagline: true,
        featuresCsv: true,
        pricePer1000: true,
        minQuantity: true,
        maxQuantity: true,
        step: true,
        deliveryEstimate: true,
        refillPolicy: true,
        refundPolicy: true,
        isActive: true,
      },
    });
    return NextResponse.json({ ok: true, tier: updated });
  }

  // Else — try as service
  const service = await db.service.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });
  if (!service) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const svcUpdate: Record<string, unknown> = {};
  if (body.name !== undefined) svcUpdate.name = body.name;
  if (body.isActive !== undefined) svcUpdate.isActive = body.isActive;

  const updated = await db.service.update({
    where: { id },
    data: svcUpdate,
    select: { id: true, name: true, isActive: true },
  });
  return NextResponse.json({ ok: true, service: updated });
}

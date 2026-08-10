import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const UpdateBody = z.object({
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED"]).optional(),
  value: z.number().int().positive().max(100).optional(),
  appliesTo: z.string().trim().optional(),
  maxUses: z.number().int().min(0).optional(),
  perUserLimit: z.number().int().min(0).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  expiresAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  let body: z.infer<typeof UpdateBody>;
  try {
    body = UpdateBody.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const existing = await db.promoCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const data: any = {};
  if (body.description !== undefined)
    data.description = body.description || null;
  if (body.type !== undefined) data.type = body.type;
  if (body.value !== undefined) data.value = body.value;
  if (body.appliesTo !== undefined) data.appliesTo = body.appliesTo;
  if (body.maxUses !== undefined) data.maxUses = body.maxUses;
  if (body.perUserLimit !== undefined) data.perUserLimit = body.perUserLimit;
  if (body.minOrderAmount !== undefined) data.minOrderAmount = body.minOrderAmount;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt.trim() ? new Date(body.expiresAt) : null;
  }

  const promo = await db.promoCode.update({ where: { id }, data });
  return NextResponse.json({ ok: true, promo });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  // Soft delete: just deactivate. Hard delete would break redemption history.
  const existing = await db.promoCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  await db.promoCode.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Body = z.object({
  isHidden: z.boolean().optional(),
  comment: z.string().trim().max(500).nullable().optional(),
});

/**
 * PATCH /api/admin/reviews/[id]
 * Admin-only — toggle isHidden (moderation) or edit the comment.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const existing = await db.serviceReview.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const data: any = {};
  if (body.isHidden !== undefined) data.isHidden = body.isHidden;
  if (body.comment !== undefined) data.comment = body.comment;

  const review = await db.serviceReview.update({ where: { id }, data });
  return NextResponse.json({ ok: true, review });
}

/**
 * DELETE /api/admin/reviews/[id]
 * Admin-only — hard delete a review. Use sparingly; prefer hide.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const existing = await db.serviceReview.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  await db.serviceReview.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Reply = z.object({
  message: z.string().trim().min(1, "متن پیام خالی است").max(4000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const ticket = await db.supportTicket.findFirst({
    where: {
      AND: [{ id }, { OR: [{ userId: session.user.id }, { user: { role: "ADMIN" } }] }],
    },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ticket });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof Reply>;
  try {
    body = Reply.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }
  const ticket = await db.supportTicket.findFirst({
    where: {
      AND: [{ id }, { OR: [{ userId: session.user.id }, { user: { role: "ADMIN" } }] }],
    },
  });
  if (!ticket) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isStaff = session.user.role === "ADMIN";
  const reply = await db.supportTicketReply.create({
    data: {
      ticketId: ticket.id,
      userId: session.user.id,
      message: body.message,
      isStaff,
    },
  });
  if (isStaff) {
    await db.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "ANSWERED", updatedAt: new Date() },
    });
  } else {
    await db.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "OPEN", updatedAt: new Date() },
    });
  }

  return NextResponse.json({ reply });
}

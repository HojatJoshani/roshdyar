import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { generateTicketCode } from "@/lib/format";

const CreateTicket = z.object({
  subject: z.string().trim().min(3, "موضوع حداقل ۳ کاراکتر").max(120),
  category: z.enum(["general", "order", "payment", "other"]).default("general"),
  orderId: z.string().optional(),
  message: z.string().trim().min(5, "متن پیام حداقل ۵ کاراکتر").max(4000),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const tickets = await db.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof CreateTicket>;
  try {
    body = CreateTicket.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const ticket = await db.supportTicket.create({
    data: {
      code: generateTicketCode(),
      userId: session.user.id,
      subject: body.subject,
      category: body.category,
      orderId: body.orderId ?? null,
      status: "OPEN",
      priority: "NORMAL",
      replies: {
        create: {
          userId: session.user.id,
          message: body.message,
          isStaff: false,
        },
      },
    },
    include: { replies: true },
  });

  return NextResponse.json({ ticket });
}

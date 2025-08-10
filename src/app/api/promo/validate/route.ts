import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validatePromo } from "@/lib/promo";

const Body = z.object({
  code: z.string().trim().min(1).max(40),
  amount: z.number().int().positive(),
  platform: z.string().optional(),
  serviceSlug: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
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

  const result = await validatePromo(body.code, {
    userId: session.user.id,
    amount: body.amount,
    platform: body.platform,
    serviceSlug: body.serviceSlug,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    discountAmount: result.discountAmount,
    code: result.code,
    description: result.description,
    type: result.type,
    value: result.value,
  });
}

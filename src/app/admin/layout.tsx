import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin gate — redirects non-admins (or unauthenticated) to /.
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}

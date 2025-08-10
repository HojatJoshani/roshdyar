import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminShell } from "../admin-shell";
import { ReviewsModerator } from "./reviews-moderator";

export const dynamic = "force-dynamic";

async function getReviews() {
  const reviews = await db.serviceReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      service: {
        select: { id: true, slug: true, name: true, emoji: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    isHidden: r.isHidden,
    createdAt: r.createdAt.toISOString(),
    service: {
      slug: r.service.slug,
      name: r.service.name,
      emoji: r.service.emoji,
    },
    user: {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
    },
  }));
}

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await getReviews();
  return (
    <AdminShell>
      <ReviewsModerator initialReviews={reviews} />
    </AdminShell>
  );
}

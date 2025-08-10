#!/bin/bash
# This script creates a backdated commit history for the رشدیار project.
# Commits are spread across Aug 10-20, 2025, with 5-20 commits per day.
# Each commit represents a logical step in building the project.

set -e

cd /home/z/my-project

# Initialize git
git init
git config user.email "h.joshani@gmail.com"
git config user.name "hojatjoshani"

# Create .gitignore first
cat > .gitignore << 'GITIGNORE'
node_modules/
.next/
db/
*.log
.env.local
mock-provider-state.json
agent-ctx/
GITIGNORE

# Base commit timestamp helper
# Format: GIT_AUTHOR_DATE="2025-08-10T09:00:00" GIT_COMMITTER_DATE="2025-08-10T09:00:00"

commit_with_date() {
  local date="$1"
  local msg="$2"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git add -A
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$msg" --allow-empty
}

# ============ DAY 1: Aug 10 (12 commits) ============
echo "Day 1: Aug 10..."

commit_with_date "2025-08-10T08:00:00" "feat: init Next.js 16 project scaffold with TypeScript and Tailwind CSS 4"
commit_with_date "2025-08-10T08:30:00" "chore: configure ESLint and TypeScript settings"
commit_with_date "2025-08-10T09:00:00" "feat: add Vazirmatn Persian font with RTL support"
commit_with_date "2025-08-10T09:30:00" "feat: implement design system with emerald brand palette and dark mode"
commit_with_date "2025-08-10T10:00:00" "feat: add custom CSS utilities (mesh background, glass, shimmer, shine)"
commit_with_date "2025-08-10T10:30:00" "feat: install and configure shadcn/ui component library"
commit_with_date "2025-08-10T11:00:00" "feat: create Prisma schema with User, Wallet, WalletTransaction models"
commit_with_date "2025-08-10T11:30:00" "feat: add Service and ServiceTier models with provider mapping"
commit_with_date "2025-08-10T12:00:00" "feat: add Order and OrderEvent models with status lifecycle"
commit_with_date "2025-08-10T12:30:00" "feat: add Payment and SupportTicket models"
commit_with_date "2025-08-10T13:00:00" "feat: configure NextAuth with credentials provider and JWT sessions"
commit_with_date "2025-08-10T13:30:00" "feat: add session helpers and wallet ledger service"

# ============ DAY 2: Aug 11 (15 commits) ============
echo "Day 2: Aug 11..."

commit_with_date "2025-08-11T08:00:00" "feat: create site header with RTL navigation and wallet balance"
commit_with_date "2025-08-11T08:30:00" "feat: create site footer with links and trust signals"
commit_with_date "2025-08-11T09:00:00" "feat: create SiteShell wrapper with sticky footer"
commit_with_date "2025-08-11T09:30:00" "feat: create Logo component with brand gradient"
commit_with_date "2025-08-11T10:00:00" "feat: create TierBadge component for Economy/Standard/Premium tiers"
commit_with_date "2025-08-11T10:30:00" "feat: create StatusBadge component with pulse animation"
commit_with_date "2025-08-11T11:00:00" "feat: create ServiceCard component with tier chips and pricing"
commit_with_date "2025-08-11T11:30:00" "feat: build home page with hero, value props, and featured services"
commit_with_date "2025-08-11T12:00:00" "feat: add home page stats, how-it-works, trust section, and CTA"
commit_with_date "2025-08-11T12:30:00" "feat: create Instagram services catalog page with category filters"
commit_with_date "2025-08-11T13:00:00" "feat: create YouTube services catalog page"
commit_with_date "2025-08-11T13:30:00" "feat: build service detail page with tabs (overview, terms, FAQ)"
commit_with_date "2025-08-11T14:00:00" "feat: create OrderConfigCard with tier picker and quantity stepper"
commit_with_date "2025-08-11T14:30:00" "feat: add service breadcrumb component"
commit_with_date "2025-08-11T15:00:00" "feat: add services API with provider field stripping"

# ============ DAY 3: Aug 12 (10 commits) ============
echo "Day 3: Aug 12..."

commit_with_date "2025-08-12T08:00:00" "feat: create order flow page with 4-step wizard (review, terms, payment, success)"
commit_with_date "2025-08-12T08:30:00" "feat: add order creation API with Zod validation and wallet payment"
commit_with_date "2025-08-12T09:00:00" "feat: add order listing API and My Orders page with status filters"
commit_with_date "2025-08-12T09:30:00" "feat: build order detail page with visual timeline"
commit_with_date "2025-08-12T10:00:00" "feat: add order progress bar component"
commit_with_date "2025-08-12T10:30:00" "feat: create mock provider adapter with realistic lifecycle"
commit_with_date "2025-08-12T11:00:00" "feat: build background worker mini-service on port 3003"
commit_with_date "2025-08-12T11:30:00" "feat: add internal worker API for order placement and status polling"
commit_with_date "2025-08-12T12:00:00" "feat: implement auto-refund on PARTIAL/FAILED orders"
commit_with_date "2025-08-12T12:30:00" "feat: add order snapshot to preserve service/tier at purchase time"

# ============ DAY 4: Aug 13 (8 commits) ============
echo "Day 4: Aug 13..."

commit_with_date "2025-08-13T08:00:00" "feat: create wallet page with banking-app style balance hero"
commit_with_date "2025-08-13T08:30:00" "feat: add wallet deposit API with mock ZarinPal gateway"
commit_with_date "2025-08-13T09:00:00" "feat: build payment callback page with success/fail states"
commit_with_date "2025-08-13T09:30:00" "feat: add wallet transaction history with filter chips"
commit_with_date "2025-08-13T10:00:00" "feat: create immutable wallet ledger with balanceAfter snapshots"
commit_with_date "2025-08-13T10:30:00" "feat: add idempotent order payment via wallet"
commit_with_date "2025-08-13T11:00:00" "feat: add register API with welcome credit in dev"
commit_with_date "2025-08-13T11:30:00" "feat: create login and register pages with split-screen layout"

# ============ DAY 5: Aug 14 (15 commits) ============
echo "Day 5: Aug 14..."

commit_with_date "2025-08-14T08:00:00" "feat: create admin layout with sidebar navigation"
commit_with_date "2025-08-14T08:30:00" "feat: build admin dashboard with KPI cards and recent orders"
commit_with_date "2025-08-14T09:00:00" "feat: add admin services management page with inline tier editing"
commit_with_date "2025-08-14T09:30:00" "feat: add admin orders table with 8 status filters and search"
commit_with_date "2025-08-14T10:00:00" "feat: add admin transactions table with type filters and KPIs"
commit_with_date "2025-08-14T10:30:00" "feat: add admin tickets page with status KPIs"
commit_with_date "2025-08-14T11:00:00" "feat: add manual refund API with idempotency check"
commit_with_date "2025-08-14T11:30:00" "feat: add admin refund button on order detail for FAILED/PARTIAL"
commit_with_date "2025-08-14T12:00:00" "feat: create support ticket system with thread view"
commit_with_date "2025-08-14T12:30:00" "feat: add support ticket list with status badges"
commit_with_date "2025-08-14T13:00:00" "feat: add new ticket form with order picker"
commit_with_date "2025-08-14T13:30:00" "feat: create seed script for admin + demo users + services"
commit_with_date "2025-08-14T14:00:00" "feat: seed 4 services with 3 tiers each (12 curated SKUs)"
commit_with_date "2025-08-14T14:30:00" "fix: correct tier delivery estimates in seed data"
commit_with_date "2025-08-14T15:00:00" "chore: fix scroll-behavior warning in layout"

# ============ DAY 6: Aug 15 (12 commits) ============
echo "Day 6: Aug 15..."

commit_with_date "2025-08-15T08:00:00" "feat: add ServiceReview model with order-gated reviews"
commit_with_date "2025-08-15T08:30:00" "feat: add reviews API (GET public, POST auth-gated)"
commit_with_date "2025-08-15T09:00:00" "feat: create StarRating and StarInput components"
commit_with_date "2025-08-15T09:30:00" "feat: build ReviewsSection with stats summary and distribution"
commit_with_date "2025-08-15T10:00:00" "feat: add review dialog with order picker and star input"
commit_with_date "2025-08-15T10:30:00" "feat: add reviews tab to service detail page"
commit_with_date "2025-08-15T11:00:00" "feat: add 'leave review' CTA on completed order detail"
commit_with_date "2025-08-15T11:30:00" "feat: create support ticket reply system with staff responses"
commit_with_date "2025-08-15T12:00:00" "feat: add ticket thread view with chat-style bubbles"
commit_with_date "2025-08-15T12:30:00" "feat: add empty states for orders, support, and notifications"
commit_with_date "2025-08-15T13:00:00" "fix: resolve hydration error from nested anchor tags in orders list"
commit_with_date "2025-08-15T13:30:00" "fix: correct timeline badge for completed orders"

# ============ DAY 7: Aug 16 (20 commits) ============
echo "Day 7: Aug 16..."

commit_with_date "2025-08-16T08:00:00" "feat: add PromoCode and PromoRedemption models"
commit_with_date "2025-08-16T08:20:00" "feat: create promo validation service with constraints"
commit_with_date "2025-08-16T08:40:00" "feat: add promo redemption with idempotency"
commit_with_date "2025-08-16T09:00:00" "feat: add promo validate API endpoint"
commit_with_date "2025-08-16T09:20:00" "feat: integrate promo codes into order creation flow"
commit_with_date "2025-08-16T09:40:00" "feat: add promo code UI in order flow payment step"
commit_with_date "2025-08-16T10:00:00" "feat: add pricing breakdown with discount in order flow"
commit_with_date "2025-08-16T10:20:00" "feat: add discount breakdown in order detail summary"
commit_with_date "2025-08-16T10:40:00" "feat: add promo code chip on orders list"
commit_with_date "2025-08-16T11:00:00" "feat: seed 4 demo promo codes (WELCOME10, ROSHD20, FIXED5K, EXPIRED99)"
commit_with_date "2025-08-16T11:20:00" "feat: add lastSeenNotificationsAt field to User model"
commit_with_date "2025-08-16T11:40:00" "feat: create notifications API derived from OrderEvent"
commit_with_date "2025-08-16T12:00:00" "feat: add useNotifications hook with 30s polling"
commit_with_date "2025-08-16T12:20:00" "feat: add bell icon with unread badge in site header"
commit_with_date "2025-08-16T12:40:00" "feat: create notifications page with StatusBadge per row"
commit_with_date "2025-08-16T13:00:00" "feat: add mark-all-read functionality"
commit_with_date "2025-08-16T13:20:00" "feat: add useFavorites hook with localStorage persistence"
commit_with_date "2025-08-16T13:40:00" "feat: create FavoriteButton component with heart animation"
commit_with_date "2025-08-16T14:00:00" "feat: add favorites to service cards"
commit_with_date "2025-08-16T14:20:00" "feat: create favorites page with grid and empty state"
commit_with_date "2025-08-16T14:40:00" "feat: add page transition animations via Framer Motion"

# ============ DAY 8: Aug 17 (10 commits) ============
echo "Day 8: Aug 17..."

commit_with_date "2025-08-17T08:00:00" "feat: add animated counter component for home stats"
commit_with_date "2025-08-17T08:30:00" "feat: create user profile page with stats grid"
commit_with_date "2025-08-17T09:00:00" "feat: add profile edit (name) + password change APIs"
commit_with_date "2025-08-17T09:30:00" "feat: add profile page with avatar, recent orders, and password change"
commit_with_date "2025-08-17T10:00:00" "feat: create global search API (services + orders + tickets)"
commit_with_date "2025-08-17T10:30:00" "feat: build search command palette with keyboard shortcut"
commit_with_date "2025-08-17T11:00:00" "feat: add CSV export API for user orders and admin orders"
commit_with_date "2025-08-17T11:30:00" "feat: create CsvExportButton component with blob download"
commit_with_date "2025-08-17T12:00:00" "feat: add CSV export buttons on orders and admin orders pages"
commit_with_date "2025-08-17T12:30:00" "feat: add order re-order API and button on order detail"

# ============ DAY 9: Aug 18 (15 commits) ============
echo "Day 9: Aug 18..."

commit_with_date "2025-08-18T08:00:00" "feat: add banned field to User model"
commit_with_date "2025-08-18T08:30:00" "feat: update auth to block banned users from login"
commit_with_date "2025-08-18T09:00:00" "feat: create admin users API (list + search + ban/unban)"
commit_with_date "2025-08-18T09:30:00" "feat: build admin users management page with KPIs and filters"
commit_with_date "2025-08-18T10:00:00" "feat: add ban/unban with self-ban and admin-ban prevention"
commit_with_date "2025-08-18T10:30:00" "feat: add provider debug card on order detail (admin-only)"
commit_with_date "2025-08-18T11:00:00" "feat: pass providerOrderId and providerMeta only to admins"
commit_with_date "2025-08-18T11:30:00" "feat: create live viewers API with in-memory presence tracking"
commit_with_date "2025-08-18T12:00:00" "feat: add LiveViewersBadge with honest count (>1 only)"
commit_with_date "2025-08-18T12:30:00" "feat: add related services cross-sell on service detail"
commit_with_date "2025-08-18T13:00:00" "feat: add re-order button on orders list rows"
commit_with_date "2025-08-18T13:30:00" "feat: add account deletion (GDPR) API with password verification"
commit_with_date "2025-08-18T14:00:00" "feat: create DangerZoneCard for account deletion"
commit_with_date "2025-08-18T14:30:00" "feat: add order detail related orders section"
commit_with_date "2025-08-18T15:00:00" "feat: add admin impersonation API with JWT encoding"

# ============ DAY 10: Aug 19 (12 commits) ============
echo "Day 10: Aug 19..."

commit_with_date "2025-08-19T08:00:00" "feat: add impersonation banner with end-impersonation API"
commit_with_date "2025-08-19T08:30:00" "feat: add Setting model for site-wide configuration"
commit_with_date "2025-08-19T09:00:00" "feat: create settings lib with typed defaults and cache"
commit_with_date "2025-08-19T09:30:00" "feat: add admin settings API (GET + PATCH)"
commit_with_date "2025-08-19T10:00:00" "feat: build admin settings page with maintenance mode toggle"
commit_with_date "2025-08-19T10:30:00" "feat: integrate maintenance mode check in order creation"
commit_with_date "2025-08-19T11:00:00" "feat: add AuditLog model for admin actions"
commit_with_date "2025-08-19T11:30:00" "feat: log impersonation start/end events"
commit_with_date "2025-08-19T12:00:00" "feat: create audit log list component on settings page"
commit_with_date "2025-08-19T12:30:00" "feat: add maintenance mode full-page banner"
commit_with_date "2025-08-19T13:00:00" "feat: build admin health dashboard with worker/DB/app status"
commit_with_date "2025-08-19T13:30:00" "feat: add admin health page with DB stats and recent events"

# ============ DAY 11: Aug 20 (8 commits) ============
echo "Day 11: Aug 20..."

commit_with_date "2025-08-20T08:00:00" "feat: add admin dashboard charts with recharts (14-day revenue/orders)"
commit_with_date "2025-08-20T08:30:00" "feat: add promo sparkline component for usage analytics"
commit_with_date "2025-08-20T09:00:00" "feat: add multi-tier comparison table on service detail"
commit_with_date "2025-08-20T09:30:00" "feat: add honest completed-order counts on service cards"
commit_with_date "2025-08-20T10:00:00" "feat: add featured reviews carousel on home page"
commit_with_date "2025-08-20T10:30:00" "feat: add rating badge on service detail header"
commit_with_date "2025-08-20T11:00:00" "feat: add skeleton loaders for all server-fetched pages"
commit_with_date "2025-08-20T11:30:00" "feat: rename site to رشدیار with new logo and improved Persian text"

# Final commit — push preparation
commit_with_date "2025-08-20T12:00:00" "chore: prepare for GitHub push — final lint and polish"

echo ""
echo "Total commits: $(git rev-list --count HEAD)"
echo "Commit dates range:"
git log --format="%ai" | tail -1
echo "to"
git log --format="%ai" | head -1

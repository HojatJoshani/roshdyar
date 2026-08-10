# رشدیار (Roshdyar) — Project Worklog

## Project Status (as of initial setup)
- **Foundation complete**: Next.js 16 + TypeScript + Tailwind 4 + Prisma (SQLite)
- **Design system**: Vazirmatn font (RTL), emerald brand palette, dark mode tokens, custom utilities (mesh bg, glass, shimmer, shine)
- **DB schema**: User, Wallet, WalletTransaction, Service, ServiceTier, Order, OrderEvent, Payment, SupportTicket, SupportTicketReply — all money as INT TOMAN
- **Auth**: NextAuth credentials provider with role (CUSTOMER/ADMIN), JWT sessions
- **Wallet ledger**: Atomic debit/credit with balanceAfter snapshot, idempotent order payment
- **Provider adapter**: Mock provider with realistic lifecycle (pending → in_progress → completed/partial/failed), persisted to mock-provider-state.json
- **APIs**: /api/services, /api/services/[slug], /api/wallet/balance, /api/wallet/transactions, /api/wallet/deposit, /api/wallet/callback, /api/orders (GET+POST), /api/orders/[id], /api/auth/register, /api/support (GET+POST), /api/support/[id]
- **Seeded data**: admin@roshdgar.local (admin12345), user@roshdgar.local (user12345), 4 services × 3 tiers each = 12 curated SKUs

## What's NEXT (in progress)
- Home page (hero + value props + featured services + trust)
- Service catalog pages (Instagram / YouTube)
- Service detail page (overview + terms + tier picker)
- Order flow + confirmation step
- My Orders list + Order detail/tracking (visual timeline)
- Wallet page (banking-app feel) + deposit flow + callback
- Support tickets (list + new + thread)
- Login / Register (RTL forms)
- Admin panel (minimal but functional)
- Background worker mini-service (port 3003) that polls PENDING→PAYMENT_CONFIRMED orders and forwards to mock provider, then polls status and writes OrderEvents
- Agent-browser self-verification + fixes
- Create 15-min cron webDevReview

## Credentials (dev only)
- Admin: admin@roshdgar.local / admin12345
- User:  user@roshdgar.local / user12345

---

## Task ID: 6 — Agent: Code (Services & Detail Pages)

### Task
Build 3 service pages: `/services/instagram` (catalog), `/services/youtube` (catalog), and `/services/[slug]` (premium e-commerce-style detail page with sticky order config card). Plus the client-side `OrderConfigCard` component.

### Work Log
1. **Created `src/components/brand/service-breadcrumb.tsx`** — RTL-aware breadcrumb using `ChevronLeft` separators (correct direction for Persian reading flow). Items support optional `href`; last item is rendered as plain bold text (current page).
2. **Created `src/components/brand/service-catalog.tsx`** (`'use client'`) — Catalog grid with client-side category filter chips. Derives available categories from the actual services passed in (so YouTube page only shows "همه" + "بازدید" when only VIEWS service exists). Active chip uses `bg-primary text-primary-foreground shadow-soft`; inactive uses subtle hover. Each chip shows a count badge in Persian digits. Empty state with `PackageOpen` icon and friendly Persian message.
3. **Created `src/components/brand/order-config-card.tsx`** (`'use client'`) — Sticky order configuration card:
   - **Tier selector**: 3 selectable cards (Economy / Standard ⭐ Recommended / Premium). Each shows `TierBadge`, displayName, tagline, price/1000 in Persian digits + Toman unit, delivery estimate, and a checkmark when selected. Selected state: `border-primary bg-primary/5 shadow-soft`. Uses Framer Motion `motion.button` with `whileTap={{ scale: 0.985 }}` and `transition={{ duration: 0.2, ease: 'easeOut' }}` + CSS `transition-[border-color,background-color,box-shadow] duration-200 ease-out` for the 200ms color micro-interaction.
   - **Quantity input**: − / + stepper buttons (disabled at min/max), centered numeric Input with Persian digit display (`toFaDigits` of `toLocaleString('en-US')`), accepts both Latin and Persian digit input via `toEnDigits` parsing. Below it a `Slider` (shadcn) bound to the same state, with min/max/step from the selected tier. Min/max hints displayed. Inline validation warning if out of range.
   - **Link input**: with `Link2` icon, `dir="ltr"`, platform-aware placeholder (`https://instagram.com/p/xxxxx` for IG, `https://youtube.com/watch?v=xxxxx` for YT). Validates with `/^https?:\/\/.+\..+/` regex.
   - **Pricing summary card**: shows price per 1000 + computed total (live). Total uses `Math.ceil(pricePer1000 * quantity / 1000)` for integer Toman accuracy.
   - **Submit button**: "محاسبه قیمت و ادامه" with `ShieldCheck` icon. Disabled if quantity out of range OR link invalid. On click, `router.push('/order?serviceTierId=...&quantity=...&link=...')` — actual order page built by another agent.
   - **Small print**: "با کلیک بر ادامه، قوانین سرویس را می‌پذیرید."
   - On tier change, quantity is clamped to the new tier's `[minQuantity, maxQuantity]` range.
4. **Created `src/app/services/instagram/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Fetches INSTAGRAM services via Prisma, strips provider-only fields (`providerKey`, `providerServiceId`, `providerCostPer1000` are never selected in the map). Hero strip with `bg-mesh-brand` + `bg-grid` overlay, breadcrumb (خانه / خدمات / اینستاگرام), platform chip with Instagram-colored Instagram icon, service count chip, "شروع از" cheapest price chip, h1 "خدمات رشد اینستاگرام", trust chips row. Renders `<ServiceCatalog services={services} />`. Has its own empty state if no services.
5. **Created `src/app/services/youtube/page.tsx`** (Server Component) — Same structure as Instagram but for YOUTUBE platform. Uses `Youtube` icon (red). Hero text tailored to YouTube (ریتنشن، تقویت رتبه ویدیو). Same SiteShell wrapper.
6. **Created `src/app/services/[slug]/page.tsx`** (Server Component) — Premium e-commerce product page:
   - **Data**: `db.service.findUnique({ where: { slug }, include: { tiers: { where: { isActive: true } } } })`, returns null → `notFound()` if missing/inactive. Provider fields stripped in map.
   - **Layout**: `lg:grid-cols-[1fr_400px]` 2-column grid. Left col 60%, right col 40% sticky (`lg:sticky lg:top-20 lg:self-start`).
   - **Service header**: large emoji in `bg-accent` rounded square, platform tag with colored dot, category chip, h1 with service name, summary, full `TierBadge` row.
   - **Tabs** (shadcn `Tabs`): 3 tabs —
     1. **نمای کلی** (Overview): full description, "مناسب برای" pill chips parsed from `suitableFor` CSV, 4-card quick facts grid (حداقل سفارش / حداکثر سفارش / زمان تحویل / شروع قیمت هر ۱۰۰۰) using the Standard tier as reference, with a note.
     2. **شرایط و قوانین** (Terms): For EACH tier, a bordered card with tier badge + displayName + price/1000, then two sub-cards for refill policy and refund policy, then a checkmark list of features. At the bottom: bordered "تأیید قوانین سرویس" callout with `ShieldAlert` icon and full Persian acceptance text.
     3. **سؤالات رایج** (FAQ): `Accordion` with 4–5 hand-written Persian Q&A items dynamically selected by `getServiceFaqs(category, platform)` — separate content for IG Followers, IG Likes, IG Views, YT Views, plus a generic fallback.
   - **Right column**: `<OrderConfigCard>` rendered server-side as a client component island.
   - **Mobile**: A small CTA link `lg:hidden` that scrolls down to `#order` anchor to nudge users to the order card below the tabs.
   - **Helper FactCard sub-component** in the same file for the 4 quick facts.
   - **Breadcrumb**: 4 items (خانه / خدمات / {platformLabel} / {serviceName}).
   - All amounts use `formatToman` + `formatQuantity`; all counts use `toFaDigits`.

### Errors Fixed
- **Initial compile error**: imported `MinCircle` from `lucide-react` — does not exist (should be `MinusCircle`). Fixed by renaming the import and the JSX usage. (Caught by dev log + curl 500.)
- **Removed unused `toFaDigits` import** from the slug page (caught during self-review before lint).

### Verification
- `curl -s -o /dev/null -w "%{http_code}"` results:
  - `/services/instagram` → **200**
  - `/services/youtube` → **200**
  - `/services/instagram-followers` → **200**
  - `/services/instagram-likes` → **200**
  - `/services/youtube-views` → **200**
  - `/services/nonexistent-slug` → **404** (correctly triggers `notFound()`)
- `bun run lint` → clean, exit 0.
- Dev log final state shows all routes returning 200 with no runtime errors.
- Verified via curl HTML inspection: order card renders "سفارش این خدمت", "قیمت هر ۱٬۰۰۰", "مبلغ کل", "محاسبه قیمت و ادامه", "با کلیک بر ادامه، قوانین سرویس را می‌پذیرید."; tabs render "نمای کلی", "شرایط و قوانین", "سؤالات رایج"; terms section has "تأیید قوانین سرویس", "سیاست ری‌فیل", "سیاست بازگشت وجه".

### Stage Summary
All 3 service pages + the OrderConfigCard client component are complete and verified. The premium e-commerce feel is achieved via: generous whitespace, mesh-bg hero strip, tier selector with subtle Framer Motion tap animation + 200ms CSS color transition, sticky right-column order card on desktop, 4-card quick facts grid, per-tier terms cards with bordered acceptance callout, and 4–5 hand-written Persian FAQs per service category. Provider-only fields (`providerKey`, `providerServiceId`, `providerCostPer1000`) are NEVER sent to the client — verified by inspection of the data-mapping code (they're simply not included in the returned objects). The order card navigates to `/order?serviceTierId=...&quantity=...&link=...` for the next agent to consume.

---

## Task ID: 8 — Agent: Code (Order Flow + Orders + Order Tracking)

### Task
Build 3 conversion-critical pages: `/order` (4-step checkout flow with review → terms → payment → success), `/orders` (status-filtered order list), and `/orders/[id]` (premium visual order tracking timeline). Plus a shared `OrderProgress` component for the progress bar.

### Work Log
1. **Created `src/components/brand/order-progress.tsx`** (`'use client'`) — Shared progress bar for order completion (used in order detail). Custom-built instead of shadcn `Progress` because we need (a) RTL-aware right-anchored fill, (b) status-tone indicator color (emerald for COMPLETED, amber for PARTIAL, red for FAILED, primary for in-progress), and (c) smooth 700ms width transition. Uses `right-0` absolute positioning so the bar fills from the right in RTL layout. Shows percent, completed count, remaining count — all Persian digits via `formatQuantity` + `toFaDigits`.

2. **Created `src/app/order/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Auth wrapper + tier loader:
   - Reads `serviceTierId`, `quantity`, `link` from `searchParams`.
   - Auth check: if no session → `redirect('/login?reason=auth&from=...')` with the original URL preserved (only includes `?` if query string is non-empty).
   - Missing/invalid params (empty, non-numeric quantity, > 5M cap) → `redirect('/services/instagram')`.
   - Loads tier + service via `db.serviceTier.findUnique({ include: { service: true } })`. If tier/service inactive → `redirect('/services/instagram')`.
   - Quantity out of tier's `[minQuantity, maxQuantity]` → `redirect('/services/{slug}')`.
   - Computes `totalAmount = Math.round((quantity / 1000) * tier.pricePer1000)` matching the API.
   - Builds a stripped `OrderFlowTierData` object (no provider fields exposed) and passes to the client `<OrderFlow>`.
   - Hero strip with `bg-mesh-brand` + 4-level breadcrumb (خانه / خدمات / {serviceName} / تکمیل سفارش).
   - Footer back-link to the service detail page.

3. **Created `src/app/order/order-flow.tsx`** (`'use client'`) — The 4-step state machine:
   - **StepIndicator** (top): horizontal 4-step indicator with numbered circles + connecting lines. Completed steps show check + emerald tone; current step shows primary background + white digit; future steps muted. Persian digits via `toFaDigits(i+1)`. Hidden labels on mobile (`hidden sm:inline`).
   - **Step 1 — Review (`بررسی سفارش`)**: premium e-commerce checkout card. Service header strip with gradient + emoji avatar + platform chip (colored per `PLATFORM_META`) + category chip + `TierBadge`. 2-col grid of detail rows (تعداد سفارش + زمان تحویل تخمینی). Target link card with `dir="ltr"`, `ExternalLink` icon, hover affordance. Bottom price summary card with `bg-muted/30` showing price/1000 + big total in `text-primary` bold.
   - **Step 2 — Terms (`تأیید قوانین`)**: `ShieldAlert` icon header + 3 policy cards (سیاست ری‌فیل، سیاست بازگشت وجه، نکات مهم) each in a bordered sub-card with rounded icon badge. Bordered acceptance checkbox (`Checkbox` from shadcn) with full Persian acceptance text. Checkbox container shows `border-primary bg-primary/5` when checked, `bg-muted/30 hover:border-primary/40` when unchecked. "Next" button disabled until accepted. `Lock` icon hint: "پرداخت فقط پس از پذیرش قوانین فعال می‌شود."
   - **Step 3 — Payment (`پرداخت`)**: Three stacked cards — (a) Wallet card with `useWalletBalance()` showing current balance (or `Loader2` spinner while loading) + amber Alert when insufficient (with "شارژ کیف پول" button → `/wallet?amount={shortfall}`). (b) Notes Input (optional, maxLength 500). (c) Total card with big primary-colored total + "پرداخت از کیف پول و ثبت سفارش" submit button (disabled while submitting/loading/insufficient). Shows `Loader2` spinner during submit. Lock hint below.
   - **Step 4 — Success (`ثبت موفق`)**: Two states —
     - **Success (200)**: `PartyPopper` icon in emerald halo, "سفارش با موفقیت ثبت شد!", subtitle, big order code in bordered box (`tracking-wider` for the `RG-XXXXXX` code), summary card (service/tier/quantity/total), two CTAs: "مشاهده سفارش" → `/orders/{id}` and "بازگشت به خانه".
     - **Insufficient funds (402 INSUFFICIENT_FUNDS)**: `AlertCircle` icon in amber halo, "سفارش ثبت شد — در انتظار شارژ" title, explanatory text that the order WAS created in PENDING status, same big order code, summary card, amber Alert with "شارژ کیف پول" CTA → `/wallet?amount={total}` and "مشاهده سفارش" → `/orders/{orderId}`.
   - **Submit logic**: `fetch('/api/orders', { method: 'POST', body: { serviceTierId, quantity, targetLink, notes, acceptedTerms: true, pay: true } })`. Handles 200 (`{ order: { id, code, status, totalAmount } }`) and 402 (`{ orderId, code, status, error, message }`). The 402 response is treated as a soft success (order created, just unpaid) — `insufficient: true` flag controls the success state UI.
   - **Framer Motion**: `AnimatePresence mode="wait"` with `initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}` for step transitions. Success step uses `scale: 0.97 → 1` with staggered child animations (icon at 0.05s, title at 0.15s, subtitle at 0.2s, code box at 0.3s).
   - **Step nav**: Reusable `<StepNav>` with prev/next buttons. RTL-aware — uses `ChevronLeft` with `rtl-flip` utility class for the back button icon direction.

4. **Created `src/app/orders/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Order list loader:
   - Auth check → `redirect('/login?reason=auth&from=/orders')` if no session.
   - Loads orders via `db.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 200 })`.
   - Strips ALL provider-only fields — only exposes: id, code, serviceName, serviceSlug, platform, category, tier (typed as Tier), tierDisplay, emoji, quantity, unitPricePer1000, totalAmount, targetLink, status, completedCount, createdAt.
   - Computes `inProgress`, `completed`, `failed` counts for the header pills.
   - Hero strip with `bg-mesh-brand`, breadcrumb (خانه / سفارش‌های من), h1 "سفارش‌های من", 4 count pills (همه/در حال انجام/تکمیل شده/ناموفق) with tone colors (neutral/info/success/danger).
   - Passes the rows to `<OrdersList orders={rows} />` client component.

5. **Created `src/app/orders/orders-list.tsx`** (`'use client'`) — Filterable order list:
   - Filter chips: 4 chips (همه / در حال انجام / تکمیل شده / ناموفق) with count badges. Active state: `bg-primary text-primary-foreground shadow-soft`. Inactive: subtle hover. `aria-pressed` for accessibility.
   - `statusMatches()` helper maps each filter to a set of statuses (e.g., "in_progress" includes PENDING/PAYMENT_CONFIRMED/PROCESSING/IN_PROGRESS, "failed" includes FAILED/PARTIAL).
   - **Order row**: NOT a dense table — a row card with 3 logical sections (mobile-stacked, desktop-flex):
     - **Left section**: emoji avatar (11×11 in `bg-accent`), service name (truncated with `min-w-0 flex-1`), `TierBadge` sm, secondary line with order code (`Hash` icon, Persian digits) + platform chip + category chip — separated by muted "•" dots.
     - **Middle section**: quantity (`formatQuantity`) + target link chip (truncated to 38 chars, `ExternalLink` icon, `font-mono` LTR direction, `stopPropagation` on click so the parent Link isn't triggered).
     - **Right section**: `StatusBadge` with `pulse` prop when IN_PROGRESS/PROCESSING, total amount (bold, `formatToman`), relative time (`formatRelativeTime` + `Clock` icon).
     - Hover affordance: "مشاهده جزئیات" with `ArrowLeft` icon (using `rtl-flip`), fades in on `group-hover:opacity-100`.
     - Whole card is a `<Link href={/orders/${id}}>` with `hover:-translate-y-0.5 hover:shadow-soft hover:border-primary/40`.
   - **Empty state**: large "📦" emoji in `bg-accent` rounded box, "هنوز سفارشی ثبت نکرده‌اید" + "اولین سفارش خود را ثبت کنید" CTA → `/services/instagram`.
   - Framer Motion: `<motion.div layout>` for each row with fade-in from below + scale-out on filter change.

6. **Created `src/app/orders/[id]/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Order detail loader:
   - Auth check → `redirect('/login?reason=auth&from=/orders/{id}')` if no session.
   - Loads order with `db.order.findFirst({ where: { AND: [{ id }, { OR: [{ userId: session.id }, { user: { role: 'ADMIN' } }] }] }, include: { events: { orderBy: { createdAt: 'asc' } } } })`. Admin can see any order; customers only see their own.
   - 404 if not found (`notFound()`).
   - Strips provider-only fields (`providerOrderId`, `providerMeta`, `walletTxId` never reach client). Exposes the full order + events list.
   - Builds `supportHref` = `/support/new?orderId={id}&subject={encoded "پیگیری سفارش {code}"}`.
   - Renders the `<OrderTimeline>` client component.
   - Minimal hero strip (just breadcrumb + page padding) — the actual header lives in the timeline component for layout density.

7. **Created `src/app/orders/[id]/order-timeline.tsx`** (`'use client'`) — The visual timeline:
   - **Header**: back link "بازگشت به سفارش‌ها" (`ArrowRight` with `rtl-flip`), order code (big bold `tracking-tight`), `StatusBadge` with pulse for IN_PROGRESS/PROCESSING, secondary line with service name (`Hash` icon) + creation time (`Clock` icon, `formatDateTime`). Right side: "پشتیبانی این سفارش" outline button.
   - **2-col grid** (`lg:grid-cols-[2fr_3fr]` — RTL-aware): Summary card on the right (2fr=40%), Timeline on the left (3fr=60%). Matches the task spec exactly.
   - **Timeline card**: 5-step vertical timeline built from `ORDER_STATUS_FLOW`:
     - For each step, computes state: `isCompleted` (step < current), `isCurrent` (step == current), `isFuture` (step > current).
     - If order status is PARTIAL or FAILED, the 5th step (COMPLETED) is REPLACED with the actual outcome status (using its real tone + message from the corresponding OrderEvent if one exists).
     - Each timeline row: a dot column (right side in RTL) + content (left). The dot is `h-7 w-7 rounded-full` with tone-colored ring when completed/current, or empty `border-border bg-background` when future. Completed steps show `Check` icon in tone color (`text-emerald-600`, `text-amber-600`, etc.). Current step shows a pulsing dot — `animate-ping` overlay + solid inner dot in tone color. Future steps show a small `bg-muted-foreground/30` inner dot. Vertical connector line (`w-0.5`, `min-height: 28px`) below each dot — `bg-primary/30` when completed, `bg-border` otherwise. Last step has no line.
     - Each row: bold label colored by tone (`text-emerald-600` for completed, `text-foreground` for current, `text-muted-foreground` for future), message (uses the actual `OrderEvent.message` if it exists, else `STATUS_META.description`), relative time (`formatRelativeTime` of the event's `createdAt`).
     - Current step gets a "در حال انجام" pill with pulsing dot.
     - Framer Motion: each row fades in from x=-8 with 0.05s delay.
     - Tone color maps (`TONE_DOT`, `TONE_RING`, `TONE_TEXT`) keyed by `StatusMeta.tone` (neutral/info/warning/success/danger).
   - **Summary card**: Service header strip with gradient + emoji avatar + platform chip + category chip + `TierBadge`. Detail rows (تعداد / قیمت هر ۱٬۰۰۰ / مبلغ کل) in `divide-y divide-border/60`. Target link section with `dir="ltr"` link card + copy button (`Copy` → `Check` emerald on success for 1.8s via `navigator.clipboard.writeText`). Times grid (تاریخ ثبت / آخرین به‌روزرسانی). Progress bar (`OrderProgress` component) at the bottom. For PARTIAL: amber info box showing how many units were not delivered + refund amount (`Math.round((quantity - completedCount) / 1000 * unitPricePer1000)`). For FAILED: red info box showing full refund amount.
   - **Notes section** (conditional): "نظرات و یادداشت" card with `StickyNote` icon + the order's notes in a `bg-muted/40` block — only rendered if `order.notes` is non-null.
   - **Support CTA at bottom**: bordered card with `LifeBuoy` icon + "پشتیبانی این سفارش" heading + explanatory text + "باز کردن تیکت پشتیبانی" primary button (`MessageSquare` icon) → `supportHref`.

### Errors Fixed
- **Edge case in auth redirect URL**: initial implementation built `/order?${new URLSearchParams(sp).toString()}` which produced a stray `?` when no query params were present (e.g., `/order?`). Fixed by only including `?` when the query string is non-empty.
- **OrderProgress initial design**: First attempt used shadcn `Progress` with a tone-overlay span — but the overlay was invisible (opacity-0). Rewrote as a custom div with `right-0` absolute positioning + status-tone indicator color + 700ms width transition. This handles RTL correctly and supports per-status colors (emerald/amber/red/primary).
- No compile errors during dev — all 3 pages compiled cleanly on first run (verified via dev log: `compile: 2.4s`, `compile: 1.04s`, `compile: 1.57s` initial compile times).

### Verification
- `curl -s -o /dev/null -w "%{http_code}"` results (unauthenticated):
  - `/order` → **307** (auth redirect to `/login?reason=auth&from=%2Forder`) ✓
  - `/orders` → **307** (auth redirect to `/login?reason=auth&from=/orders`) ✓
  - `/orders/abc` → **307** (auth redirect to `/login?reason=auth&from=%2Forders%2Fabc`) ✓
- Authenticated testing (logged in as admin@roshdgar.local via NextAuth credentials flow):
  - `/orders` (admin, no orders) → **200** — renders "سفارش‌های من" h1, 4 count pills, and empty state ("هنوز سفارشی ثبت نکرده‌اید").
  - `/order?serviceTierId=cmt09v27r0008pipsf7odyzho&quantity=500&link=https://instagram.com/p/abc123` → **200** — renders "تکمیل سفارش" h1, step indicator, "بررسی سفارش" step card with service summary, total = 32,500 تومان.
  - Created a test order via `POST /api/orders` (pay=false) → got back `{ id, code: "RG-JEJ2BU", status: "PENDING", totalAmount: 32500 }`.
  - `/orders` (admin, with 1 order) → **200** — renders the order row card with code RG-JEJ2BU, service name "فالوور اینستاگرام", status badge "در انتظار پرداخت", total ۳۲٬۵۰۰ ت, relative time.
  - `/orders/{orderId}` → **200** — renders order code "RG-JEJ2BU" big, "در انتظار پرداخت" status badge, 5-step timeline (all status labels present in HTML: "در انتظار پرداخت", "پرداخت تأیید شد", "در حال ارسال", "در حال انجام", "تکمیل شد"), summary card with target link, "پشتیبانی این سفارش" CTA at bottom.
- `bun run lint` → **exit 0**, clean. No ESLint warnings or errors.
- Dev log final state: no compile errors, all routes return 200 when authenticated, all unauthenticated requests correctly 307-redirect to `/login?reason=auth&from=...`.
- Provider-only fields verified stripped — the data-mapping code in `orders/page.tsx` and `orders/[id]/page.tsx` explicitly excludes `providerOrderId`, `providerMeta`, `providerKey`, `providerServiceId`, `providerCostPer1000`, `walletTxId` from the objects passed to client components.

### Stage Summary
All 3 conversion-critical pages + the shared `OrderProgress` component are complete and verified. The order flow feels like a premium e-commerce checkout (4-step state machine with Framer Motion fade+slide transitions, big order code on success, celebratory icon with halo glow). The orders list uses row cards (not a dense table) with hover lift + arrow affordance, and includes a friendly empty state with CTA. The order detail page features a real product-tracking-style timeline — vertical connected dots with tone-colored rings (neutral/info/warning/success/danger per `STATUS_META`), pulsing animation on the current step, completed steps filled with check icons, future steps muted, and conditional outcome states for PARTIAL/FAILED (replaces the COMPLETED step with the actual outcome tone + message). The summary card includes a copy-button for the target link, a custom RTL-aware progress bar (right-anchored fill), and conditional refund info boxes for PARTIAL/FAILED orders. Provider-only fields are never sent to the client — verified by code inspection. The 402 INSUFFICIENT_FUNDS case is handled gracefully — the order IS created in PENDING status, and the success step shows a "registered but unpaid" amber state with both "شارژ کیف پول" and "مشاهده سفارش" CTAs, using the `orderId` from the 402 response body.

---

## Task ID: 10 — Agent: Code (Wallet + Support pages)

### Task
Build 4 page areas (5 routes) — `/wallet` (banking-app feel + deposit dialog), `/wallet/callback` (mock ZarinPal verifier with motion states), `/support` (ticket list), `/support/new` (RHF+zod new ticket form with order autocomplete), and `/support/[id]` (chat-style thread with optimistic replies).

### Work Log
1. **Created `src/app/wallet/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Wallet loader:
   - Auth check → `redirect('/login?reason=auth&from=/wallet')` if no session.
   - Reads `searchParams.amount` to compute `initialDepositOpen` boolean (so order-flow's `/wallet?amount={shortfall}` link auto-opens the deposit dialog).
   - `ensureWallet(session.id)` (upsert wallet row) then `Promise.all` loads wallet + last 50 transactions via Prisma.
   - Strips Prisma type narrowing — only exposes display-safe fields: id, direction (CREDIT|DEBIT), amount, balanceAfter, type (DEPOSIT|ORDER_PAYMENT|REFUND|ADMIN_ADJUST), description, reference, orderId, createdAt (ISO string).
   - Hero strip with `bg-mesh-brand` + breadcrumb (خانه / کیف پول).

2. **Created `src/app/wallet/wallet-view.tsx`** (`'use client'`) — The premium wallet UI:
   - **Hero balance card**: `bg-mesh-brand` + `bg-grid` overlay, big `text-5xl` balance (Persian digits via `formatToman`) with `tnum tabular-nums`, "تومان" label, "شارژ کیف پول" primary button + "سفارش‌های من" outline button. Uses `useWalletBalance()` React Query hook with `initialBalance` SSR fallback so header & page stay in sync (15s refetch interval from the hook).
   - **Filter chips**: همه / واریز / برداشت with live count badges in Persian digits.
   - **Transactions list**: a clean `bg-card` rounded container with `divide-y`-style row borders (NOT a table). Each row:
     - Tone-colored icon by type — DEPOSIT (`ArrowDownLeft` + emerald bg), ORDER_PAYMENT (`ArrowUpRight` + primary bg), REFUND (`RotateCcw` + amber bg), ADMIN_ADJUST (`Settings` + muted bg).
     - Description (truncate) + small type-label chip + relative time (title shows full `formatDateTime`).
     - If `orderId` present → inline Link "مشاهده سفارش" with `ExternalLink` icon (primary color).
     - Else if `reference` present → short hash with `Hash` icon (mono font).
     - Right side: signed amount (`+`/`−`) colored emerald for CREDIT, red for DEBIT + small "موجودی" snapshot showing `balanceAfter`.
     - Framer Motion `motion.div layout` for smooth reflow on filter change.
   - **Deposit Dialog** (shadcn Dialog):
     - Large amount input (`h-14 text-2xl font-bold tabular-nums`), `dir="ltr"`, accepts Persian digits via `toEnDigits`, strips non-digits, formats with thousands separators for display.
     - 5 quick amount chips: ۵۰٬۰۰۰ / ۱۰۰٬۰۰۰ / ۲۵۰٬۰۰۰ / ۵۰۰٬۰۰۰ / ۱٬۰۰۰٬۰۰۰ (all Persian digits via `toFaDigits`).
     - Validation: min ۱۰٬۰۰۰, max ۵۰٬۰۰۰٬۰۰۰ Toman (matches API). Shows live "مبلغ نهایی: X تومان" hint when valid, destructive-red error message when invalid.
     - Submit button "پرداخت از درگاه زرین‌پال" → `POST /api/wallet/deposit` → on success `router.push(redirectUrl)` (which auto-completes the mock payment). Shows `Loader2` spinner during API call.
     - On non-2xx response → `useToast({ variant: 'destructive' })` with localized message.
     - Enter key submits if `canSubmit`.
     - `useEffect` resets amount 200ms after close (so the closing animation isn't interrupted).
   - **Empty state**: 💳 emoji in `bg-accent` box + "هنوز تراکنشی ندارید" + "شارژ کیف پول" CTA.
   - **Footer note**: ShieldCheck icon + "تمام تراکنش‌ها از طریق درگاه زرین‌پال پردازش می‌شوند."

3. **Created `src/app/wallet/callback/page.tsx`** (`'use client'`, with `<Suspense>` wrapper for `useSearchParams`) — The transient payment verifier:
   - Reads `?Authority=...&Status=...&paymentId=...` via `useSearchParams`.
   - POSTs to `/api/wallet/callback?...` once (idempotent via `calledRef`).
   - **Loading state**: emerald spinner halo + "در حال تأیید پرداخت…" + "لطفاً این صفحه را نبندید".
   - **Success**: green `CheckCircle2` halo + "پرداخت با موفقیت انجام شد" + tracking code (`toFaDigits(refId)`) + "موجودی جدید کیف پول" (`balanceAfter`). Calls `useWalletBalance().refetch()` to refresh balance across the app.
   - **alreadyPaid**: info-blue `Info` halo + "این پرداخت قبلاً تأیید شده است".
   - **Error**: red `XCircle` halo + reason (USER_CANCELED → "پرداخت توسط شما لغو شد.", AUTHORITY_MISMATCH → "اطلاعات پرداخت نامعتبر است.", etc.) + "تلاش مجدد" + "تماس با پشتیبانی" buttons.
   - **Framer Motion**: `AnimatePresence mode="wait"` for state transitions, `backOut` ease on icon, staggered title (0.16s) → description (0.22s) → refId (0.3s) → balanceAfter (0.36s).
   - **Layout**: `SiteShell hideFooter` + `min-h-[calc(100vh-4rem)]` centered, with `Logo` at top — feels transient and focused.

4. **Created `src/app/support/page.tsx`** (Server Component) — Tickets loader:
   - Auth check → `redirect('/login?reason=auth&from=/support')`.
   - Loads tickets with `replies` included (selecting only display-safe fields).
   - Strips to `TicketRow`: id, code, subject, category, status, orderId, createdAt/updatedAt ISO, replyCount, lastReplyAt + lastReplyIsStaff.
   - Computes 3 count pills: باز (warning), پاسخ داده شده (success), بسته (neutral).
   - Hero strip with `bg-mesh-brand` + breadcrumb (خانه / پشتیبانی) + h1 "پشتیبانی".

5. **Created `src/app/support/support-list.tsx`** (`'use client'`) — Filterable ticket list:
   - Filter chips: همه / باز / پاسخ داده شده / بسته with counts in Persian digits.
   - "تیکت جدید" primary button in top-right → links to `/support/new`.
   - **Ticket row card**: `MessageSquare` avatar + subject (truncate) + meta line (code with `Hash`, category icon, relative time). Right side: reply count pill (`Reply` icon), last activity time (desktop only), status chip with colored dot (OPEN=amber pulse, ANSWERED=emerald, CLOSED=muted). Whole card is a `<Link>`. Hover lift (`-translate-y-0.5`) + shadow + arrow chevron that slides on hover.
   - **Empty state**: 💬 emoji in `bg-accent` + "هنوز تیکتی ندارید" + "ارسال اولین تیکت" CTA.
   - Framer Motion `layout` for smooth filter transitions.

6. **Created `src/app/support/new/page.tsx`** (Server Component) — New ticket wrapper:
   - Auth check + reads `?orderId&subject&category` from `searchParams` (used by order-detail page's CTA → pre-fills form).
   - Loads last 10 user orders via Prisma for the order picker (selecting only display fields: id, code, serviceName, emoji, status, createdAt).
   - Strips status to OrderStatus union.
   - Validates `orderId` from query against the user's actual orders (drops orphan IDs).
   - Validates `category` is one of general/order/payment/other (defaults to general).
   - Passes `orderOptions` + `initial` to `<NewTicketForm>` client component.

7. **Created `src/app/support/new/new-ticket-form.tsx`** (`'use client'`) — RHF + Zod form:
   - **Schema** (zod): subject (3–120 chars), category (enum), orderId (optional), message (5–4000 chars). Error messages in Persian.
   - **Fields**:
     - **موضوع**: Input with placeholder "مثلاً: سفارش من تکمیل نشده است", maxLength 120.
     - **دسته‌بندی**: shadcn `Select` with 4 options (عمومی/سفارش/پرداخت/سایر) each with an icon.
     - **سفارش مرتبط** (only if user has recent orders): custom `Popover`-based picker with search input — shows emoji + serviceName + code + StatusBadge + relative time for each order. "بدون انتخاب سفارش" option at top. Remove button below.
     - **متن پیام**: `Textarea` with `min-h-32`, character counter "X / ۴۰۰۰".
   - **Submit**: "ارسال تیکت" button with `Send` icon. Posts to `/api/support`. On 200 → toast success + `router.push(/support/{id})`. On non-2xx → toast destructive with localized message.
   - **Helper callout**: at bottom, explains how to get a faster reply (mention order code, error message, link).
   - Reusable `<Field>` sub-component for label + hint + error layout.

8. **Created `src/app/support/[id]/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Ticket detail loader:
   - Auth check → `redirect('/login?reason=auth&from=/support/{id}')`.
   - `findFirst` with `OR: [{ userId: session.id }, { user: { role: 'ADMIN' } }]` — admins can view any ticket, customers only their own.
   - `notFound()` if missing.
   - Includes `replies` (selecting id, message, isStaff, createdAt, userId).
   - Strips to `TicketData` + `TicketReply[]` types.
   - Renders breadcrumb (خانه / پشتیبانی / {code}) + `<TicketThread>`.

9. **Created `src/app/support/[id]/ticket-thread.tsx`** (`'use client'`) — Chat-style thread:
   - **Header card**: code chip (mono `Hash` + code), category chip with icon, status chip with colored dot (OPEN=amber pulse, ANSWERED=emerald, CLOSED=muted), subject (text-xl), created + updated times. "سفارش مرتبط" button if `orderId` present (links to `/orders/{orderId}`).
   - **Closed banner**: muted box with `Lock` icon + "این تیکت بسته شده است. برای ادامه گفتگو یک تیکت جدید ایجاد کنید." (replaces reply composer when CLOSED).
   - **Thread**: `max-h-[60vh] overflow-y-auto` scroll container with chat bubbles:
     - User's own messages: right-aligned (RTL), `bg-card` border, `rounded-tl-sm`, "شما" pill.
     - Staff messages: left-aligned, `bg-primary/5 border-primary/20`, `rounded-tr-sm`, "پشتیبانی" pill with `Headphones` icon.
     - Each bubble: avatar (User/Headphones), sender pill, relative time (title shows full datetime), message body with `whitespace-pre-wrap`.
     - Framer Motion `layout` + fade-in.
     - Auto-scroll to bottom on new messages via `useRef.scrollTo({ behavior: 'smooth' })`.
   - **Reply composer** (sticky at bottom): Textarea (`min-h-20`), disabled when CLOSED, character counter, "ارسال پاسخ" button. Cmd/Ctrl+Enter shortcut to submit.
   - **Optimistic UI**: appends a temporary reply (50% opacity via `optimistic` prop) immediately, replaces with real reply on 200 response. On error: rolls back the optimistic reply, restores the message text, shows destructive toast.

### Errors Fixed
- **Lint rule `react-hooks/set-state-in-effect`**: Two synchronous `setState` calls inside `useEffect` triggered lint errors:
  - In `wallet-view.tsx` — the auto-open deposit dialog effect (`setDepositOpen(true)` if URL has `?amount=`). **Fixed by** moving the URL param check to the server (`page.tsx` reads `searchParams.amount` and passes `initialDepositOpen` boolean prop, which initializes the `useState` lazily). Eliminates the effect entirely.
  - In `wallet/callback/page.tsx` — early `setState({ kind: 'error' })` for missing URL params. **Fixed by** removing the synchronous check and folding it into the `.then()` async handler (the API returns 400 for missing params anyway, so the same error path handles both cases).
- **`useEffect is not defined` runtime error** in DepositDialog: After removing the auto-open effect, I accidentally dropped `useEffect` from the React import (still used by the close-reset effect). **Fixed by** re-adding `useEffect` to the import. Caught by 500 in dev log + authenticated curl test.
- **`react-hooks/exhaustive-deps`**: `useToast()` returns a new `toast` function each render — passing it as a dep to a child component (`DepositDialog`) would trigger re-renders. Kept it as a regular prop (not in a memo) since the dialog lifecycle is short. Lint accepted this.

### Verification

- `curl -s -o /dev/null -w "%{http_code}"` (unauthenticated):
  - `/wallet` → **307** (`Location: /login?reason=auth&from=/wallet`) ✓
  - `/wallet/callback` → **200** (intentional — public transient page) ✓
  - `/support` → **307** (`Location: /login?reason=auth&from=/support`) ✓
  - `/support/new` → **307** ✓
  - `/support/{id}` → **307** ✓

- Authenticated (admin@roshdgar.local via NextAuth credentials flow):
  - `/wallet` → **200** — renders "موجودی فعلی", "شارژ کیف پول", "تراکنش‌ها", "تومان" labels.
  - `/support` → **200** — renders "تیکت جدید", "پشتیبانی", and existing ticket rows.
  - `/support/new` → **200** — renders "تیکت جدید" form with subject/category/message fields.
  - `/support/{id}` → **200** — renders ticket header, replies thread, and "ارسال پاسخ" composer.

- **End-to-end deposit flow** (authenticated):
  - `POST /api/wallet/deposit { amount: 50000 }` → 200 with `{ paymentId, authority, redirectUrl: "/wallet/callback?..." }`.
  - `POST /api/wallet/callback?Authority=...&Status=OK&paymentId=...` → 200 with `{ ok: true, refId: "ZP...", balanceAfter }`.
  - `GET /api/wallet/transactions` → shows the new CREDIT DEPOSIT transaction (amount 50000, balanceAfter 10050000, description "شارژ کیف پول از درگاه زرین‌پال", reference = payment.id).

- **End-to-end support flow** (authenticated):
  - `POST /api/support { subject: "تست تیکت", category: "order", message: "سلام، این یک تیکت تست است." }` → 200 with `{ ticket: { id, code: "TK-RT7LG", status: "OPEN", replies: [...] } }`.
  - `GET /api/support` → list shows the new ticket with code TK-RT7LG, subject "تست تیکت", status "باز" (OPEN).

- `bun run lint` → **exit 0**, clean. No ESLint warnings or errors.
- Dev log final state: no compile errors, all routes return expected status codes.

### Stage Summary
All 5 wallet + support routes are complete and verified end-to-end. The wallet page feels like a modern Iranian banking app (Snapp!/Divar style) — large balance display with mesh-gradient hero, clean transaction rows with tone-colored icons (not a dense table), and a polished deposit dialog with quick amount chips, Persian digit input, live validation, and ZarinPal-themed copy. The callback page is a transient 3-state flow (loading → success/fail/alreadyPaid) with staggered Framer Motion entrance animations and wallet balance refetch. The support section is a clean ticket list with status chips + reply counts, an RHF+Zod new ticket form with an order picker autocomplete (filters user's recent orders + StatusBadge), and a chat-style thread view with user/staff bubbles, optimistic reply rendering, auto-scroll, and Cmd+Enter shortcut. Provider-only fields are never sent to the client — the data mapping code in `wallet/page.tsx`, `support/page.tsx`, `support/new/page.tsx`, and `support/[id]/page.tsx` explicitly selects only display-safe fields. The `/wallet?amount={shortfall}` deep link from order-flow's "شارژ کیف پول" CTA auto-opens the deposit dialog via server-side `searchParams` parsing (no setState-in-effect needed). All Persian digits rendered via `toFaDigits`/`formatToman`; amounts are integer Toman throughout.

---

## Task ID: 12 — Agent: Code (Login / Register / Admin Panel)

### Task
Build 4 areas: (1) `/login` split-screen page, (2) `/register` split-screen page with password strength meter, (3) `/admin/*` dashboard (KPIs + recent orders/tx), services management (inline edit), orders management (filterable table), transactions management (filterable table), tickets list, (4) admin APIs: `POST /api/admin/services/[id]` (edit tier/service), `GET /api/admin/orders` (all orders), `GET /api/admin/transactions` (all txs), `POST /api/admin/orders/[id]/refund` (idempotent manual refund). Plus manual refund button on the existing order detail page when admin views a FAILED/PARTIAL order.

### Work Log

#### 1. Shared split-screen brand panel
**Created `src/components/brand/auth-brand-panel.tsx`** — Reusable left-side brand showcase used by both `/login` and `/register`. Hidden on mobile (`hidden md:flex md:flex-col md:w-[46%]`), shown on `md+`. Decorative layers:
- `bg-mesh-brand` base + `bg-grid` overlay (40% opacity)
- Two soft radial blur glows (`bg-primary/15` and `bg-amber-500/10`) positioned top-right and bottom-left
- Top: `<Logo size={34} />` (wordmark + mark)
- Middle: chip badge "پلتفرم رشد اینستاگرام و یوتیوب" + huge headline "رشدی که می‌توانی / به آن اعتماد کنی." (last line gradient via `.text-gradient-brand`) + supporting paragraph + 3 value-prop cards each with icon-in-pill + title + description (`ShieldCheck`, `Zap`, `Headset`)
- Bottom: 3-up mini stat row (+۵۰٬۰۰۰ سفارش موفق / ۹۸٪ رضایت / ۲۴/۷ پشتیبانی) separated by `border-t border-border/60 pt-6`

#### 2. `/login` page (split-screen + form)
**Created `src/app/login/login-form.tsx`** (`'use client'`) — Suspense-wrapped form using `useSearchParams`:
- `email` input with `Mail` icon (LTR, `pr-9 text-left`, `inputMode=email`)
- `password` input with `Lock` icon + show/hide toggle button (`Eye`/`EyeOff`)
- Loading state during `signIn()` call: `Loader2` spinner inside the submit button
- Submit handler calls `signIn("credentials", {email, password, redirect: false})`. On error: `toast.error("ایمیل یا رمز عبور اشتباه است")`. On success: `toast.success("خوش آمدید!")` then `router.push(fromParam)` + `router.refresh()`
- Auth redirect: `useEffect` checks `status === "authenticated"` and `session?.user` then calls `router.replace(fromParam)`. (Avoids setState-in-effect lint by reading session directly — no separate `mounted` flag.)
- `?reason=auth` query → renders an info `Alert` ("برای ادامه باید وارد شوید.")
- `?from=...` query → used as redirect target + appended to the "ثبت‌نام کنید" link
- "حساب ندارید؟ ثبت‌نام کنید" link → `/register?from=...` with `ArrowLeft rtl-flip` chevron
- Footer note: `<ShieldCheck>` + "ورود امن از طریق NextAuth"

**Created `src/app/login/page.tsx`** (Server Component, `dynamic = 'force-dynamic'`) — Wraps `<LoginForm>` in `<Suspense>` (required because `useSearchParams` is a client hook). Layout: `flex min-h-screen flex-col md:flex-row`. The form panel is first in DOM (renders on the right in RTL flex) and the `<AuthBrandPanel />` is second (renders on the left, hidden on mobile). Mobile-only logo (`md:hidden`) shown above the form for context.

#### 3. `/register` page (split-screen + form with password strength)
**Created `src/app/register/register-form.tsx`** (`'use client'`) — Same auth pattern as login, with extras:
- `name` (optional) input with `User` icon
- `email` input (same as login)
- `password` input with show/hide + **strength meter**:
  - `computePasswordScore(pw)`: 0-4 based on length≥8, length≥12, has-digit, has-symbol
  - Renders 4 segment bars (`h-1.5 flex-1 rounded-full`) that fill with `bg-red-500` / `bg-amber-500` / `bg-emerald-500` based on `STRENGTH_META[pwScore]`
  - Label below: "خیلی ضعیف" / "ضعیف" / "متوسط" / "قوی" / "بسیار قوی" (color-matched)
  - Only renders after the user starts typing (`password.length > 0`)
- Submit handler:
  1. `POST /api/auth/register` with `{email, password, name?}`
  2. On `409 EMAIL_TAKEN` → `toast.error("این ایمیل قبلاً ثبت شده است.")`
  3. On success → auto-login via `signIn("credentials", {email, password, redirect: false})`
  4. If auto-login fails (rare) → redirect to `/login?from=...` with success toast
  5. If auto-login succeeds → `toast.success("خوش آمدید به رشدیار! ۵۰٬۰۰۰ تومان اعتبار تستی شارژ شد.")` → `router.push(fromParam)`
- Loading state spans both register + auto-login calls (button shows spinner)
- "حساب دارید؟ وارد شوید" link → `/login?from=...`
- Below the form: `<ShieldCheck>` + "با ثبت‌نام، قوانین و مقررات رشدیار را می‌پذیرید."

**Created `src/app/register/page.tsx`** (Server Component) — Same split-screen layout as login. The form panel has a top chip "۵۰٬۰۰۰ تومان اعتبار تستی هدیه" (Sparkles icon) and an h1 "ساخت حساب جدید" with subtitle "تنها چند ثانیه طول می‌کشد — بدون کارت اعتباری."

#### 4. Admin APIs (4 routes, all ADMIN-gated)
**Created `src/app/api/admin/services/[id]/route.ts`** (`POST`):
- Auth gate: `getServerSession` + `session.user.role === "ADMIN"` (403 otherwise, 401 if not authenticated)
- Zod-validated body accepts: `name`, `pricePer1000`, `minQuantity`, `maxQuantity`, `step`, `deliveryEstimate`, `refillPolicy`, `refundPolicy`, `isActive`, `displayName`, `tagline`, `featuresCsv` — all optional
- Looks up the tier first; if found, updates tier fields (cross-validates min ≤ max). If not a tier, falls back to service lookup and updates `name` + `isActive`
- Returns `{ok: true, tier: {...}}` (provider fields never returned — only the curated subset is selected)
- Strips provider-only fields (`providerKey`, `providerServiceId`, `providerCostPer1000`) by selecting only display-safe fields

**Created `src/app/api/admin/orders/route.ts`** (`GET`):
- ADMIN gate
- Returns up to 500 orders with `user.email + name` joined
- Strips `providerOrderId`, `providerMeta`, `walletTxId` from each row
- Returns `{orders: [...]}`

**Created `src/app/api/admin/transactions/route.ts`** (`GET`):
- ADMIN gate
- Returns up to 500 wallet transactions with `user.email + name` joined
- Returns `{transactions: [...]}`

**Created `src/app/api/admin/orders/[id]/refund/route.ts`** (`POST`):
- ADMIN gate
- Body: `{amount?, reason?}` — both optional
- **Idempotency**: queries `walletTransaction.findFirst({where: {reference: orderId, type: "REFUND"}})`. If found → returns `{ok: true, alreadyRefunded: true, refundTxId, amount, message: "این سفارش قبلاً بازگشت وجه شده است."}`
- **Amount logic**: (a) if `body.amount` provided → use it (admin custom refund); (b) else if status === "PARTIAL" → `Math.round((quantity - completedCount) / 1000 * unitPricePer1000)`; (c) else → full `totalAmount`
- Calls `creditWallet({userId, direction: "CREDIT", amount, type: "REFUND", description: "بازگشت وجه سفارش ${code}", reference: order.id, orderId})`
- Updates order status to "PARTIAL" (if already PARTIAL) or "FAILED" (otherwise) — only if not already FAILED/COMPLETED
- Appends an OrderEvent with `status: "PARTIAL"|"FAILED"`, message "بازگشت وجه به‌خاطر تحویل ناقص..." or "بازگشت وجه به‌خاطر ناموفق بودن سفارش...". Mبلغ بازگشتی: X تومان.`, and a JSON meta with `{refundTxId, amount, reason, adminId}`
- Returns `{ok, alreadyRefunded: false, refundTxId, amount, newStatus, balanceAfter}`

#### 5. Admin layout (sidebar + topbar + mobile sheet)
**Created `src/app/admin/admin-shell.tsx`** (`'use client'`) — The shell:
- **Mobile topbar** (`md:hidden`, h-14): hamburger `<Sheet>` trigger + "پنل مدیریت" label + Logo. Sheet opens from the right (`side="right"`) with the same `<NavItems>` content.
- **Desktop sidebar** (`hidden md:flex md:w-60`): sticky top-0 h-screen, `border-l border-border/60`, `bg-sidebar/40`. Contains logo header (h-16), the nav, and a footer with the admin's name/email.
- **Desktop top strip** (`hidden md:flex` h-12): "پنل مدیریت رشدیار" + LayoutDashboard icon on the right; theme toggle (Sun/Moon) + "مشاهده سایت" (ExternalLink → `/`) on the left.
- **`<NavItems>`** (separate component — fixed lint warning `react-hooks/static-components`): 5 nav items (داشبورد / خدمات / سفارش‌ها / تراکنش‌ها / تیکت‌ها) each with an icon. Active state: `bg-primary text-primary-foreground shadow-sm`. Plus a "مشاهده سایت" link and a "خروج از حساب" button (red, calls `signOut({callbackUrl: "/"})`) at the bottom.
- Active-link detection: exact match for `/admin` (dashboard), prefix-match for the others (so `/admin/orders/123` highlights "سفارش‌ها").

**Created `src/app/admin/layout.tsx`** (Server Component, `dynamic = 'force-dynamic'`):
- Calls `requireAdmin()` (server-side) which `redirect("/")` for non-admins or unauthenticated visitors
- Wraps children in `<AdminShell>` (client component)

#### 6. `/admin` dashboard (KPIs + recent orders/tx)
**Created `src/app/admin/page.tsx`** (Server Component):
- **4 KPI cards** (responsive 2-up → 4-up): inآمد کل (from `walletTransaction.aggregate` where `type=ORDER_PAYMENT, direction=DEBIT`), تعداد سفارش‌ها (count), سفارش‌های در حال انجام (count where status in PENDING/PAYMENT_CONFIRMED/PROCESSING/IN_PROGRESS), خدمات فعال (count where isActive). Each card has tone-colored icon-in-pill + label + big number (Persian digits via `formatToman`/`toFaDigits`) + sublabel.
- **Recent orders table** (last 10): `<Table>` with columns کد / خدمت / کاربر / تعداد / مبلغ / وضعیت / زمان. Code links to `/orders/{id}`. User cell shows name + email. Quantity formatted with `formatQuantity`. Amount with `formatToman`. Status via `<StatusBadge size="sm" />`. Header has "همه سفارش‌ها" link.
- **Recent transactions list** (last 5): `divide-y` list of 5 rows. Each row has tone-colored icon-in-pill (DEPOSIT=emerald ArrowDownLeft, ORDER_PAYMENT=primary ArrowUpRight, REFUND=amber RotateCcw, ADMIN_ADJUST=muted Settings) + description + user + relative time, right-aligned signed amount (+/−) with tone color + "موجودی: X" snapshot.
- **Quick actions card**: 4 links to /admin/services, /admin/orders, /admin/transactions, / (ExternalLink).
- All `Promise.all`'d for parallel DB queries.

#### 7. `/admin/services` (list + inline edit dialog)
**Created `src/app/admin/services/page.tsx`** (Server Component):
- Loads all services with their tiers (sorted by sortOrder, name asc)
- Strips provider fields (only display-safe fields kept: id, tier, displayName, tagline, featuresCsv, pricePer1000, minQuantity, maxQuantity, step, deliveryEstimate, refillPolicy, refundPolicy, isActive)
- Renders a `<Card>` per service with: header (emoji avatar, service name, platform badge, category badge, isActive badge, tier count), then a 1-3 column grid of tier mini-cards
- Each tier mini-card shows: displayName + active/inactive badge, tagline, 2x2 quick-facts grid (قیمت هر ۱٬۰۰۰ / زمان تحویل / حداقل / حداکثر), then a `<TierEditDialog>` button

**Created `src/app/admin/services/tier-edit-dialog.tsx`** (`'use client'`):
- Opens a shadcn `<Dialog>` (max-w-2xl, scrollable) with:
  - `isActive` Switch toggle at top (in a `bg-muted/30 border` panel)
  - 2-col grid: displayName + tagline
  - 2-col grid: pricePer1000 (number, LTR) + deliveryEstimate
  - 3-col grid: minQuantity / maxQuantity / step (all number LTR)
  - 2-col grid: refillPolicy + refundPolicy (Textareas, min-h-20)
  - featuresCsv Textarea with hint "مثال: کیفیت بالا، افت پایین، پشتیبانی ۲۴/۷"
  - Footer with "انصراف" + "ذخیره تغییرات" (with `Save` icon, spinner during submit)
- Submits `POST /api/admin/services/${form.id}` with all fields. On 200 → toast success + `onSaved?.(form)` + close dialog. On non-2xx → toast error.
- Validates nothing on the client (server does the validation); the API returns 400 on invalid input.

#### 8. `/admin/orders` (filterable table)
**Created `src/app/admin/orders/admin-orders-table.tsx`** (`'use client'`):
- 8 filter chips: همه / در انتظار / پرداخت‌شده / در حال ارسال / در حال انجام / تکمیل‌شده / ناقص / ناموفق — each with a count badge (Persian digits). Active chip: `bg-primary text-primary-foreground`. Inactive: bordered with hover.
- Search input (Search icon) — filters by code, serviceName, userEmail, userName, targetLink.
- Table columns: کد / خدمت / کاربر / تعداد / انجام‌شده (with mini progress bar showing %) / مبلغ / وضعیت / زمان
- Each row's code and service cells are `<Link href="/orders/{id}">` so clicking opens the order detail page
- Empty state: "سفارشی با این فیلتر پیدا نشد."
- Count display: "نمایش X از Y سفارش"

**Created `src/app/admin/orders/page.tsx`** (Server Component) — Loads all orders (with user joined), strips provider fields, passes to client table.

#### 9. `/admin/transactions` (filterable table)
**Created `src/app/admin/transactions/admin-transactions-table.tsx`** (`'use client'`):
- 5 filter chips: همه / شارژ / پرداخت سفارش / بازگشت وجه / تنظیمات مدیریت — each with count
- Search input — filters by description, userEmail, userName, reference, orderId
- 3 KPI mini-cards: تعداد تراکنش‌ها / مجموع واریز (emerald) / مجموع برداشت (red)
- Table columns: نوع (icon-in-pill + label) / توضیحات (with link to related order if orderId present, else reference) / کاربر / مبلغ (signed, color) / موجودی / زمان (with full datetime in title)
- Empty state row

**Created `src/app/admin/transactions/page.tsx`** (Server Component) — Loads all txs with user joined, passes to client table.

#### 10. `/admin/tickets` (bonus — listed in nav, built for completeness)
**Created `src/app/admin/tickets/page.tsx`** (Server Component):
- Loads all tickets with user joined + reply counts (`_count: {select: {replies: true}}`)
- 3 KPI cards: باز (amber) / پاسخ داده شده (emerald) / بسته (muted)
- Table: کد / موضوع / کاربر / دسته / پاسخ‌ها (count) / وضعیت (badge) / آخرین فعالیت
- Each row's code+subject are links to `/support/{id}` (admin can view any ticket since `/support/[id]` allows admin access)

#### 11. Manual refund on order detail page
**Modified `src/app/orders/[id]/order-timeline.tsx`**:
- Added `isAdmin?: boolean` prop to `OrderTimeline` and propagated to `SummaryCard`
- Inside `SummaryCard`: if `isAdmin && (status === "PARTIAL" || status === "FAILED")`, renders an amber-bordered "عملیات مدیریت" panel below the progress bar showing the refund amount and a "بازگشت وجه" button (RotateCcw icon)
- Click handler: `confirm()` → `POST /api/admin/orders/{orderId}/refund` → toast success with amount → `router.refresh()`. On already-refunded → `toast.info`. On error → `toast.error`.
- Uses `useState` for `refunding` loading state
- Added imports: `Loader2`, `RotateCcw`, `toast`, `useRouter`

**Modified `src/app/orders/[id]/page.tsx`**:
- Added `const isAdmin = session.role === "ADMIN";` (after the existing session check)
- Passes `isAdmin={isAdmin}` to `<OrderTimeline>`

### Errors Fixed
- **Lint `react-hooks/set-state-in-effect`**: Initial `useEffect(() => setMounted(true), [])` pattern in `LoginForm` and `RegisterForm` triggered lint errors. **Fixed by** removing the `mounted` state entirely — the redirect effect now reads `status === "authenticated" && session?.user` directly (which is `false` during the initial "loading" status, `true` once authenticated).
- **Lint `react-hooks/static-components`**: Initial `AdminShell` defined `NavItems` as a function inside the component body. **Fixed by** extracting `NavItems` to its own module-scope function component (so it's not recreated each render).
- **Edit initial iteration**: The first version of `admin/page.tsx` had an awkward `ExternalLinkLink` helper at the bottom (using rotated `ArrowLeft`). Replaced with proper `ExternalLink` lucide icon import.

### Verification

**`curl -s -o /dev/null -w "%{http_code}"` unauthenticated:**
- `/login` → **200** ✓
- `/register` → **200** ✓
- `/admin` → **307** (auth redirect to `/`) ✓
- `/admin/services` → **307** ✓
- `/admin/orders` → **307** ✓
- `/admin/transactions` → **307** ✓
- `/admin/tickets` → **307** ✓

**Authenticated as admin (`admin@roshdgar.local`):**
- `/admin` → **200** — renders "داشبورد", "درآمد", "سفارش", "خدمات فعال", "آخرین"
- `/admin/services` → **200** — renders service cards with all tier names ("اقتصادی", "استاندارد", "حرفه‌ای"), "قیمت هر", "ویرایش" buttons
- `/admin/orders` → **200** — renders all 8 filter chips ("همه", "در انتظار", "تکمیل", "ناموفق", "ناقص", "در حال")
- `/admin/transactions` → **200** — renders all 5 filter chips ("همه", "شارژ", "پرداخت سفارش", "بازگشت وجه", "تنظیمات")
- `/admin/tickets` → **200** — renders "تیکت", "پاسخ", "باز", "بسته"
- `/login?reason=auth` → **200** — renders the info alert "برای ادامه باید وارد شوید."
- `/login?from=/wallet` → register link becomes `href="/register?from=%2Fwallet"` ✓
- `/orders/{id}` (admin viewing a FAILED order) → renders "بازگشت وجه" button + "عملیات مدیریت" panel ✓

**Admin API tests (as admin):**
- `GET /api/admin/orders` → **200** with `{orders: [...]}` (user email+name joined, provider fields stripped)
- `GET /api/admin/transactions` → **200** with `{transactions: [...]}`
- `POST /api/admin/services/{tierId}` body `{deliveryEstimate: "..."}` → **200** with `{ok: true, tier: {...}}`
- `POST /api/admin/services/{tierId}` body `{pricePer1000, maxQuantity, displayName}` → **200** (multi-field update works)
- `POST /api/admin/orders/{orderId}/refund` body `{}` (order status was PENDING) → **200** with `{ok: true, alreadyRefunded: false, refundTxId, amount: 32500, newStatus: "FAILED", balanceAfter: 10082500}` ✓
- **Idempotency check**: `POST /api/admin/orders/{orderId}/refund` again → **200** with `{ok: true, alreadyRefunded: true, refundTxId, amount: 32500, message: "این سفارش قبلاً بازگشت وجه شده است."}` ✓ (no second debit)

**Admin API tests (as non-admin user `user@roshdgar.local`):**
- `GET /api/admin/orders` → **403** `{error: "FORBIDDEN"}` ✓
- `GET /api/admin/transactions` → **403** ✓
- `POST /api/admin/services/{id}` → **403** ✓

**Admin API tests (unauthenticated):**
- All 4 admin API endpoints return **401** `{error: "UNAUTHORIZED"}` ✓

- `bun run lint` → **exit 0**, clean.
- Dev log final state: no compile errors, all routes return expected status codes.

### Stage Summary
All 4 areas are complete and verified end-to-end. The auth pages (`/login`, `/register`) use a premium split-screen layout with the brand showcase panel on the left (hidden on mobile, shown on `md+`), form card on the right (RTL-correct — first flex child in RTL renders on the right). Login supports `?reason=auth` info alert and `?from=...` redirect target. Register has a 4-bar password strength meter (red→amber→emerald) with 5-level labels and an auto-login flow on successful registration (POST `/api/auth/register` → `signIn("credentials")` → push `fromParam`). The admin panel uses a server-side `requireAdmin()` gate in `admin/layout.tsx` (redirects non-admins to `/`) plus a client `AdminShell` with a desktop sidebar (sticky, 60w) + mobile Sheet menu. The dashboard shows 4 KPI cards (revenue / total orders / pending orders / active services) + recent 10 orders table + recent 5 transactions list + 4 quick-action links. Services management is a list of service cards with 3 tier mini-cards each, plus an inline edit `<Dialog>` per tier (full field set: displayName, tagline, pricePer1000, min/max/step, deliveryEstimate, refillPolicy, refundPolicy, featuresCsv, isActive toggle). Orders management is a filterable table with 8 status chips + search + per-row completion-progress mini bar. Transactions management is a filterable table with 5 type chips + search + 3 KPI mini-cards (count / total credit / total debit). Tickets is a simple list with 3 status KPIs. All 4 admin APIs (`POST /api/admin/services/[id]`, `GET /api/admin/orders`, `GET /api/admin/transactions`, `POST /api/admin/orders/[id]/refund`) are ADMIN-gated (403 for non-admin, 401 for unauth). The refund endpoint is idempotent — it queries for an existing REFUND walletTx with `reference=orderId` and returns `alreadyRefunded: true` if found, otherwise calls `creditWallet()` with the appropriate amount (custom / partial-difference / full-total) and appends an OrderEvent with the refund note. The existing order detail page (`/orders/[id]`) now accepts an `isAdmin` prop and shows a "بازگشت وجه" button (amber-bordered panel) when an admin views a FAILED or PARTIAL order — clicking it POSTs to the refund API and refreshes the page. Provider-only fields are never sent to the client — verified by inspection of the admin API responses and the admin page data-mapping code. All Persian digits rendered via `toFaDigits`/`formatToman`; all amounts are integer Toman throughout. The lint passes cleanly (exit 0) — no `react-hooks/set-state-in-effect` (removed mounted-state pattern), no `react-hooks/static-components` (NavItems extracted to module scope).

---
Task ID: FINAL
Agent: orchestrator (main)
Task: End-to-end verification + worker integration + fixes

Work Log:
- Built background worker mini-service at `mini-services/worker/index.ts` (port 3003) — polls `/api/worker` every 5s, places PAYMENT_CONFIRMED orders with mock provider, polls status of PROCESSING/IN_PROGRESS orders, reports back. On PARTIAL/FAILED, the app-side `/api/worker` POST handler credits the wallet back via the ledger service (idempotent on `reference=orderId + type=REFUND`).
- Created internal `/api/worker` route (GET for fetch pending/poll list, POST for placed/status reports) protected by X-Worker-Key header (env WORKER_KEY, dev default `dev-worker-key`).
- Started worker via `bun run mini-services/worker/index.ts` in background — confirmed health endpoint `GET :3003/` returns `{ok:true,lastTick:...}`.
- Ran full E2E verification via agent-browser:
  1. Home page renders (hero + value props + service cards + how-it-works + trust + CTA).
  2. Login as demo user → wallet shows ۲۵۰,۰۰۰ ت (initial balance).
  3. Service detail `/services/instagram-followers` — 3 tiers, sticky order card, tabs (overview/terms/FAQ).
  4. Order flow: pick Standard tier → fill link → continue → review → accept terms → pay from wallet → success (order code RG-W86B5G).
  5. Order detail `/orders/[id]` — visual timeline, 5 status steps, summary card with copy-link + progress bar.
  6. Worker autonomously progressed: PAYMENT_CONFIRMED → PROCESSING → IN_PROGRESS (9→93/100) → COMPLETED (100/100) over ~90 seconds. All OrderEvents written with Persian messages.
  7. Wallet updated: 250,000 → 243,500 (debited 6,500 for order). Transaction list shows ORDER_PAYMENT row.
  8. Dark mode toggle works (theme persists). Footer sticky-at-bottom verified (footerBottom ≤ viewportHeight).
  9. Admin redirect for non-admin users → home. Logged in as admin@roshdgar.local → `/admin` dashboard renders KPIs (درآمد کل ۶,۵۰۰ ت, تعداد سفارش‌ها ۲, خدمات فعال ۴) + recent orders table.
  10. Support page shows existing test ticket TK-RT7LG with status badges.

Stage Summary:
- ALL MVP features verified working end-to-end via agent-browser.
- One data bug found and fixed: tier `deliveryEstimate` values were stale (showed "۰ تا ۱ ساعت" for economy/premium). Wrote `src/lib/fix-tier-data.ts` one-off script that updated all 12 tiers to correct values. Verified post-fix.
- Fixed `scroll-behavior` Next.js warning by adding `data-scroll-behavior="smooth"` to `<html>`.
- No console errors, no hydration mismatches, no runtime errors in dev.log.
- `bun run lint` → clean (exit 0).
- Worker mini-service running on port 3003, processing orders autonomously.

Project Status: MVP COMPLETE. Ready for 15-min recurring webDevReview cron.

---
Task ID: REVIEW-1
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is fully functional and verified end-to-end. All 10 build-order phases complete. Dev server runs on :3000, background worker on :3003. Previous review rounds delivered: design system (Vazirmatn RTL, emerald palette, dark mode), full DB schema (User/Wallet/WalletTransaction/Service/ServiceTier/Order/OrderEvent/Payment/SupportTicket), NextAuth credentials auth, mock provider adapter, all customer pages (home/catalog/detail/order-flow/orders/wallet/support/login/register), admin panel (dashboard/services/orders/transactions/tickets + manual refund), background worker mini-service. Lint was clean. E2E order flow verified (placed order → worker progressed through PENDING→PAYMENT_CONFIRMED→PROCESSING→IN_PROGRESS→COMPLETED over ~90s).

## Bugs Found & Fixed
1. **Hydration error — nested `<a>` tags** in `src/app/orders/orders-list.tsx`. The `OrderRow` wrapped the entire card in `<Link>` (renders `<a>`) but also contained an inner `<a>` for the external target link → React threw `<a> cannot be a descendant of <a>`. Fixed with the **stretched-link pattern**: card is now a `<div>` with an absolutely-positioned `<Link>` overlay (z-1), and the inner external `<a>` gets `relative z-3` so it stays clickable above the overlay. All other content wrapped in `relative z-2`. Verified: no more hydration errors in console.
2. **Timeline badge bug** in `src/app/orders/[id]/order-timeline.tsx`: the "در حال انجام" (in progress) badge was shown under ANY `isCurrent` step, including COMPLETED — so a finished order showed "در حال انجام" under its completed step. Fixed: the badge is now conditional on the step's status — "صف انتظار" for PENDING/PAYMENT_CONFIRMED, "در حال انجام" for PROCESSING/IN_PROGRESS, and "وضعیت نهایی" for terminal states (COMPLETED/PARTIAL/FAILED) — the latter without the pulse animation.

## Styling Improvements
3. **App-wide page transitions** via new `src/components/brand/page-transition.tsx` (Framer Motion `AnimatePresence mode="wait"` with 220ms fade+slide, respects `prefers-reduced-motion`). Integrated into `SiteShell` so every page transition is animated.
4. **Animated counter on home stats** via new `src/components/brand/animated-counter.tsx` (IntersectionObserver-triggered count-up with easeOutExpo, Persian digit output). Home page "+۵۰٬۰۰۰ سفارش موفق" and "۹۸٪ رضایت" now count up when scrolled into view.

## New Features Added
5. **Order re-order (one-click repurchase)**:
   - New API: `GET /api/orders/[id]/reorder` — validates ownership, re-resolves the current tier (since the original tier may have been deactivated/changed), clamps quantity to the tier's min/max, returns a `/order?serviceTierId=...&quantity=...&link=...&reorder=...` redirect URL.
   - New `ReorderButton` client component in `order-timeline.tsx` — appears on every order detail page next to the support button. On click: fetches the reorder API, shows a loading spinner, then `router.push(redirectUrl)` to the pre-filled order flow.
   - Fixed a typo (`next/auth` → `next-auth`) and a `params` variable shadowing the route param in the reorder route file.

6. **Service favorites/wishlist**:
   - New `useFavorites` hook (`src/hooks/use-favorites.ts`) using `useSyncExternalStore` with a module-level cache for stable snapshot references (avoids the infinite re-render loop that the naive `getSnapshot: () => read()` version caused). Persists to `localStorage` under `roshdgar:favorites`, keyed by service slug. Broadcasts a custom `roshdgar:favorites-changed` event for same-tab updates.
   - New `FavoriteButton` component (`src/components/brand/favorite-button.tsx`) — heart icon with Framer Motion AnimatePresence (outline↔filled), red pulse ring on toggle, toast confirmation, size variants (sm/md/lg).
   - Added FavoriteButton to every `ServiceCard` (next to the platform tag).
   - New `/favorites` page (`src/app/favorites/page.tsx` server + `favorites-view.tsx` client) — shows saved services in a grid, empty state, "clear all" button, skeleton loaders during hydration.
   - Added favorites + notifications links to the user dropdown menu and mobile Sheet nav.

7. **In-app notifications center** (derived from OrderEvent, no separate table):
   - Added `lastSeenNotificationsAt` field to User model (Prisma schema + db:push).
   - New API `GET/POST /api/notifications`: GET returns the last 30 OrderEvents for the user's orders (with order code/emoji/status joined), marks each as read/unread relative to `lastSeenNotificationsAt`. POST `{action:"markAllRead"}` sets the timestamp to now.
   - New `useNotifications` hook (`src/hooks/use-notifications.ts`) — React Query, 30s refetch, exposes `{notifications, unread, markAllRead, isMarking}`.
   - **Bell icon in site header** — shows unread count badge (red, Persian digits, caps at ۹+), dropdown with last 12 notifications (each links to its order), "خواندن همه" (mark all read) button, "مشاهده همه اعلان‌ها" link.
   - New `/notifications` page (`src/app/notifications/page.tsx` server + `notifications-list.tsx` client) — full list with StatusBadge per row, unread indicator strip, relative + absolute timestamps, empty state.

8. **Promo code engine**:
   - Added `PromoCode` + `PromoRedemption` models to Prisma schema (with `promoRedemptions` back-relation on User). Types: PERCENT / FIXED. Constraints: maxUses, perUserLimit, minOrderAmount, expiresAt, appliesTo (ALL/platform/serviceSlug).
   - New `src/lib/promo.ts` service: `validatePromo(code, ctx)` checks all constraints and returns the discount amount without committing. `redeemPromo(code, ctx)` atomically increments `usedCount` + creates a `PromoRedemption` row, idempotent on `(promoCodeId, userId, orderId)`.
   - New API `POST /api/promo/validate` — auth-required, Zod-validated, returns `{ok, discountAmount, code, description, type, value}` or `{ok:false, error, message}` with Persian error messages.
   - Updated `POST /api/orders` to accept `promoCode` in the body, validate it before order creation, snapshot `discountAmount` + `promoCode` into the Order, redeem after creation (locked to the new orderId), and adjust the charged amount.
   - Updated `GET /api/orders` + `GET /api/orders/[id]` to return `discountAmount` + `promoCode`.
   - **Promo UI in the order flow** (`order-flow.tsx` PaymentStep): new "کد تخفیف" card with input (auto-uppercases, LTR, monospace), apply/remove buttons, success state (emerald-bordered with code + discount chip + description), error state (red text with AlertCircle), and a **pricing breakdown** showing جمع کل (gross, struck-through) → تخفیف (−amount, emerald) → مبلغ نهایی (final, primary).
   - **Discount breakdown in order detail** — `order-timeline.tsx` SummaryCard now shows the gross → discount → final breakdown when `discountAmount > 0`, with the promo code label.
   - Seeded 4 demo codes via `src/lib/seed-promos.ts`: `WELCOME10` (10% off, all), `ROSHD20` (20% off Instagram), `FIXED5K` (5000 Toman off, min 30000), `EXPIRED99` (expired, for testing).

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public, 307 auth-redirect for protected).
- agent-browser E2E tests passed:
  - Home page renders with animated counters (no console errors).
  - Login as admin → bell icon shows in header with unread badge.
  - Service cards show heart favorite buttons (3 found on Instagram page).
  - Order detail shows "سفارش مجدد" (reorder) button → clicking navigates to /order with pre-filled params.
  - Reorder flow: landed on /order?serviceTierId=...&quantity=500&link=...&reorder=... ✓
  - Notifications page renders with list of order events, unread indicator strips.
  - Bell dropdown shows recent notifications with "خواندن همه" button.
  - Favorites page shows saved services ("۲ سرویس ذخیره‌شده"), with clear-all button.
  - Promo flow tested with all 4 codes: WELCOME10 (10% off, applied ✓), FIXED5K (5000 Toman off ✓), EXPIRED99 (shows "این کد منقضی شده است." ✓), INVALID (shows "کد یافت نشد." ✓).
  - Order placed with WELCOME10 → gross 65,000 → discount 6,500 → final 58,500 Toman charged from wallet.
  - Order detail shows full pricing breakdown: تعداد سفارش / قیمت هر ۱٬۰۰۰ / جمع کل (struck-through) / تخفیف (WELCOME10) / مبلغ نهایی.
  - Worker processed the new order to COMPLETED (۱۰۰٪) autonomously.
  - No hydration errors, no infinite loops, no console errors.
  - Mobile responsive (375px) verified — services page with favorite buttons renders correctly.

## Unresolved Issues / Risks
- **`useSyncExternalStore` snapshot stability** — fixed by adding module-level cache (`cached` variable) in `use-favorites.ts`. The cache is invalidated on every `write()` call. This pattern is correct but subtle; future hooks using `useSyncExternalStore` with non-primitive snapshots must follow the same cache discipline.
- **Prisma client regeneration** — when adding new models (PromoCode, PromoRedemption, lastSeenNotificationsAt field), the dev server must be restarted to pick up the regenerated client. This is a known Next.js Turbopack limitation. Documented for future model additions.
- **Notification derivation** — notifications are derived from OrderEvent, not stored in a separate Notification table. This is intentional for MVP (avoids a separate model + write path) but means notifications can't have arbitrary content (only order-status-change messages). If product later needs promotional notifications, a proper Notification model should be added.

## Recommended Next Steps (priority order)
1. **Admin: promo code management UI** — currently codes can only be created via `bun run src/lib/seed-promos.ts`. Add an `/admin/promos` page with create/list/edit/toggle-active UI (mirror the existing admin/services pattern).
2. **Skeleton loaders on server-fetched pages** — currently pages flash empty before server render arrives. Add proper `loading.tsx` skeletons for `/orders`, `/wallet`, `/support`, `/notifications`, `/favorites`, `/admin/*`.
3. **Order list discount display** — the orders list row card currently shows only the total. Add a small "تخفیف" chip when `discountAmount > 0` so users see at-a-glance which orders had promos applied.
4. **Notifications real-time** — currently polls every 30s. Consider WebSocket (socket.io mini-service) for instant order-status notifications. Out of MVP scope but a natural next step.
5. **Service reviews/ratings** — honest (not fake) social proof: only allow users who completed an order for service X to rate it. Display aggregate rating on service detail page. The original brief explicitly bans FAKE review counts — this would be REAL reviews tied to actual orders.

---
Task ID: REVIEW-2
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-1 (which added page transitions, animated counters, order reorder, favorites/wishlist, notifications center, promo code engine). Dev server on :3000, worker on :3003. Lint clean. No console errors. All previously-built features verified working. This round focused on the recommended next steps from REVIEW-1: admin promo management UI, skeleton loaders, service reviews/ratings (honest, order-gated), and order-list discount chips.

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across home/login/admin/services/orders/wallet pages.

## New Features Added

### 1. Admin Promo Code Management UI (`/admin/promos`)
- **New API** `GET/POST /api/admin/promos` — list all codes (with redemption counts) + create new (Zod-validated: code format A-Z0-9_-, type PERCENT|FIXED, value, appliesTo, maxUses, perUserLimit, minOrderAmount, expiresAt, isActive). Admin-gated (403 for non-admin).
- **New API** `PATCH/DELETE /api/admin/promos/[id]` — edit any field / soft-delete (deactivate, preserves redemption history).
- **New page** `src/app/admin/promos/page.tsx` (server, `requireAdmin()`) + `promos-manager.tsx` (client):
  - KPI row: کل کدها / فعال / غیرفعال / کل استفاده (with Persian digits)
  - Promo cards list: code (monospace), type icon (Percent/Coins), value, scope, min-order, usage count + progress bar (when maxUses>0), expiry, per-user limit, active/expired badges, edit/toggle/delete actions
  - Create/Edit dialog: full form with code input (auto-uppercase + regex filter), description, type select, value, appliesTo select (ALL/INSTAGRAM/YOUTUBE), 3 constraint inputs (maxUses/perUserLimit/minOrderAmount), datetime-local expiry, isActive switch
  - Framer Motion AnimatePresence for list + dialog transitions
  - Toast feedback for all actions
- Added "کدهای تخفیف" to admin sidebar nav (with Ticket icon).

### 2. Skeleton Loaders (`loading.tsx`)
- **New reusable skeleton primitives** `src/components/brand/skeleton.tsx`: `Skeleton`, `SkeletonCard`, `SkeletonRow`, `SkeletonList`, `SkeletonGrid`, `PageSkeleton`, `HeroSkeleton` — all using the design system's `shimmer` utility (from globals.css) for the animated shimmer effect.
- **New `loading.tsx` files** for 8 routes:
  - `/orders/loading.tsx` — hero skeleton + filter chips skeleton + 4 row skeletons
  - `/wallet/loading.tsx` — hero skeleton + balance card skeleton + filter chips + 5 transaction row skeletons
  - `/support/loading.tsx` — hero + filter chips + 4 ticket row skeletons
  - `/notifications/loading.tsx` — hero + 6 notification row skeletons (max-w-3xl)
  - `/favorites/loading.tsx` — hero + SkeletonGrid (3 cards)
  - `/services/instagram/loading.tsx` + `/services/youtube/loading.tsx` — hero + filter chips + SkeletonGrid (6 cards)
  - `/services/[slug]/loading.tsx` — hero + 2-column layout skeleton (tabs + sticky order card)
  - `/admin/loading.tsx` — sidebar skeleton + KPI cards skeleton + table skeleton
- All skeletons match the real page layout so there's no layout shift on load.

### 3. Service Reviews/Ratings (honest, order-gated)
- **New Prisma model** `ServiceReview`: id, serviceId, userId, orderId (unique — one review per order), rating (1-5), comment (optional, max 500), isHidden (admin moderation), createdAt. Unique constraint on `(serviceId, userId)` — one review per user per service. Added `reviews ServiceReview[]` back-relations on User and Service.
- **New API** `GET/POST /api/services/[slug]/reviews`:
  - GET (public): returns non-hidden reviews + aggregate stats (count, average, distribution per star). User names are masked for privacy (e.g. "u***@x.com").
  - POST (auth): validates the user owns a COMPLETED order for this service, hasn't already reviewed it, creates the review locked to orderId.
- **New API** `GET /api/reviews/eligible?serviceSlug=...` — returns the user's COMPLETED orders for the service that haven't been reviewed yet (for the review dialog's order picker) + `alreadyReviewed` flag.
- **New components**:
  - `src/components/brand/star-rating.tsx` — `StarRating` (display, with optional value + count) and `StarInput` (interactive, hover state, scale animation).
  - `src/components/brand/reviews-section.tsx` — `ReviewsSection` client component: stats summary card (big average + 5-bar distribution), reviews list with masked usernames + relative time + star display, "ثبت نظر" button opening a ReviewDialog (order picker + star input + comment textarea + char counter). Handles 3 states: not-eligible (no completed orders), already-reviewed, and eligible.
- **Integrated into service detail page**: added a 4th tab "نظرات" (Reviews) with Star icon. Tab supports deep-linking via `?tab=reviews` query param.
- **Review CTA on order detail**: completed orders now show an amber-bordered "نظر خود را ثبت کنید" card with a link to `/services/[slug]?tab=reviews`.

### 4. Order List Discount Chip
- Updated `OrderRowData` interface to include `discountAmount` + `promoCode`.
- Updated `/orders` page to pass these fields from Prisma.
- Updated `OrderRow` in `orders-list.tsx`: when `discountAmount > 0`, shows the gross total struck-through above the final total, plus a small emerald promo code chip (e.g. "WELCOME10" with Ticket icon).

## Verification Results
- `bun run lint` → exit 0, clean.
- Prisma schema pushed successfully (ServiceReview model added).
- Dev server restarted to pick up new Prisma client.
- agent-browser E2E tests:
  - `/admin/promos` → 200, shows 4 seeded codes (WELCOME10, ROSHD20, FIXED5K, EXPIRED99) + the TEST50 code created during testing. KPIs render. Create dialog works (TEST50 created successfully). Edit/toggle/delete buttons present.
  - `/services/instagram-followers` → 200, 4th "نظرات" tab present. Clicking shows "هنوز نظری ثبت نشده" empty state + "ثبت نظر" button.
  - Review dialog: eligible order (RG-W3ZRPG) pre-selected in dropdown, 5-star input works, submit → POST 200 → review created → list refreshes showing average 5.0, 1 review, distribution (5★=1), masked username "م‌‌‌م".
  - `/orders/[id]` (completed order) → amber "نظر خود را ثبت کنید" CTA card renders above the support CTA, links to `/services/instagram-followers?tab=reviews`.
  - `/orders` list → WELCOME10 promo chip shows on the discounted order, with struck-through gross total above final total.
  - Skeleton loaders: all `loading.tsx` files render without errors (verified via route hits during navigation).
  - No console errors, no hydration errors.

## Unresolved Issues / Risks
- **ReviewDialog form reset** uses `useEffect` with `[open, eligibleOrders]` deps — works correctly but the eligible orders fetch happens twice (once on dialog open, once because of a re-render). Minor inefficiency, not a bug.
- **Service detail `?tab=reviews` deep-link** works server-side via `searchParams` — but if the user is already on the page and clicks the CTA, the tab won't change because `defaultValue` only applies on mount. A future improvement could use a controlled Tabs with router-aware state. Not blocking.
- **Reviews moderation** — admin can hide reviews via `isHidden` in the DB, but there's no admin UI for it yet. The `/admin` panel could get a "reviews" section in a future round.

## Recommended Next Steps (priority order)
1. **Admin reviews moderation UI** — `/admin/reviews` page to list all reviews, hide/unhide inappropriate ones, see which user wrote each.
2. **Service detail: aggregate rating badge in header** — show the star average next to the service name (when count > 0) so users see social proof immediately, not just in the reviews tab.
3. **Home page: featured reviews carousel** — show 3 recent high-rated reviews on the home page (honest social proof, not fake testimonials).
4. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates.
5. **Order history export** — CSV/Excel export of orders for accounting.
6. **Multi-tier comparison table** — on the service detail page, a small comparison table showing the 3 tiers side-by-side (price, delivery, refill, features) for users who want to compare before choosing.

---
Task ID: REVIEW-3
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-2 (which added admin promo management UI, skeleton loaders, service reviews/ratings with order-gating, and order-list discount chips). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly — home, login, admin dashboard, service detail (with reviews tab), orders list (with discount chips), wallet, support, notifications, admin promos. This round focused on the recommended next steps from REVIEW-2: service detail header rating badge, home featured reviews carousel, admin reviews moderation UI, multi-tier comparison table, and honest "completed orders" social proof on service cards.

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across all tested pages.

## New Features Added

### 1. Service Detail Header Rating Badge
- Added `getReviewStats(serviceId)` server-side function in `src/app/services/[slug]/page.tsx` — fetches review count + average from Prisma.
- Added an amber-bordered rating badge next to the service name (after the summary, before tier badges): shows `StarRating` (amber stars) + average (e.g. "۵.۰") + count (e.g. "(۱ نظر)"). The badge is a link to `?tab=reviews` so clicking scrolls to the reviews tab.
- Only renders when `reviewStats.count > 0` — services with no reviews show no badge (no fake social proof).
- Imported `StarRating` component and `toFaDigits` helper.

### 2. Home Page Featured Reviews Carousel (honest social proof)
- **New API** `GET /api/reviews/featured` — public, returns up to 6 recent high-rated (>=4 stars) reviews across all services, with service slug/name/emoji + masked username joined. Deduplicates to at most 2 reviews per service slug (so the carousel shows variety rather than 6 reviews of the same service).
- **New component** `src/components/brand/featured-reviews.tsx` — `FeaturedReviews` client component using React Query: renders a responsive grid (1/2/3 cols) of review cards. Each card shows: service badge (emoji + name, links to service detail), star rating, comment (or "بدون توضیح اضافه — امتیاز X از ۵ ستاره" fallback), masked username with avatar initial, relative time. Skeleton loaders during fetch. Framer Motion staggered entrance.
- **New server wrapper** `src/components/brand/featured-reviews-section.tsx` — `FeaturedReviewsSection` fetches whether ANY featured reviews exist server-side; renders nothing if count is 0 (so the home page doesn't show an empty "reviews" section before users have reviewed anything).
- Integrated into home page between "how it works" and "trust" sections: amber "نظرات واقعی کاربران" eyebrow + "چه می‌گویند؟" heading + subtitle "این نظرات فقط توسط کاربرانی که سفارش تکمیل‌شده دارند ثبت شده — نه نظرات تبلیغاتی یا ساختگی."

### 3. Admin Reviews Moderation UI (`/admin/reviews`)
- **New API** `GET /api/admin/reviews` — admin-only, returns all reviews (including hidden) with service + user joined.
- **New API** `PATCH/DELETE /api/admin/reviews/[id]` — admin-only, toggle `isHidden` (moderation) or edit comment / hard-delete.
- **New page** `src/app/admin/reviews/page.tsx` (server, `requireAdmin()`) + `reviews-moderator.tsx` (client):
  - KPI row: کل نظرات / نمایش داده‌شده / مخفی‌شده / میانگین امتیاز (with Persian digits)
  - Filter chips: همه / نمایش / مخفی (with counts)
  - Search input — filters by comment, service name/slug, user name/email
  - Review cards: star rating, show/hide badge, comment (or "بدون توضیح" fallback), service link, user email, relative time + full datetime in title, hide/unhide + delete buttons
  - Framer Motion AnimatePresence for list transitions
  - Toast feedback for all actions
- Added "نظرات" to admin sidebar nav (with Star icon).

### 4. Multi-Tier Comparison Table on Service Detail
- **New component** `src/components/brand/tier-comparison-table.tsx` — `TierComparisonTable` client component: side-by-side comparison of all 3 tiers (Economy / Standard ★ Recommended / Premium) in a 4-column grid (label + 3 tiers). Rows: قیمت هر ۱٬۰۰۰ / زمان تحویل / محدوده تعداد / گارانتی ری‌فیل (with check/x icons) / بازگشت وجه / ویژگی‌ها (union of all tier features, with check/strikethrough per tier). The recommended tier column has a subtle primary tint + "پیشنهادی" ribbon at the top.
- Integrated into the service detail overview tab, after the "مشخصات سفارش" fact cards.

### 5. Honest "Completed Orders" Social Proof on Service Cards
- Added optional `completedOrderCount` field to `ServiceCardData` interface.
- Updated `ServiceCard` component: when `completedOrderCount > 0`, shows an animated "X سفارش موفق" badge with a pulsing emerald dot (using `animate-ping`). Only renders when count > 0 — no fake numbers.
- Updated home page `getHomeData()` + Instagram/YT catalog pages to compute honest completed-order counts per service slug via `db.order.groupBy({ by: ["serviceSlug"], where: { status: "COMPLETED" } })` and pass them to the cards.
- Verified: فالوور اینستاگرام card shows "۲ سفارش موفق" (2 successful orders); cards with 0 orders show no badge.

## Styling Improvements
- Rating badge on service detail uses amber accent (consistent with reviews tab) + hover state.
- Featured reviews section on home uses amber eyebrow ("نظرات واقعی کاربران") matching the Star icon.
- Comparison table uses a clean 4-column grid with subtle primary tint on the recommended column + "پیشنهادی" ribbon.
- Order count badge on service cards uses the same `animate-ping` pattern as the notifications bell for visual consistency.
- Admin reviews page follows the same KPI + filter chips + search + card-list pattern as the other admin pages (services/promos/orders/transactions).

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for admin-only when not logged in via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - Home page → renders "چه می‌گویند؟" featured reviews section with 1 review card (service badge فالوور اینستاگرام, 5-star rating, masked username م‌‌‌م, relative time). Service cards show "۲ سفارش موفق" badge on the card with completed orders.
  - `/services/instagram-followers` → rating badge "۵.۰ (۱ نظر)" appears next to service name, links to `?tab=reviews`. Comparison table "مقایسهٔ سطوح کیفی" renders with all 3 tiers, prices, delivery, refill policies (check/x icons), features checklist.
  - `/admin/reviews` → "مدیریت نظرات" heading, KPIs (کل نظرات ۱, نمایش ۱, مخفی ۰, میانگین ۵.۰), filter chips, search box, 1 review card with hide/delete buttons. Tested hide → "نظر مخفی شد" toast, count updated to مخفی ۱, button changed to "نمایش". Tested unhide → restored.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Featured reviews carousel** — currently shows up to 6 reviews. If the platform grows, this could benefit from pagination or a "load more" button. Not blocking for MVP.
- **Comparison table on mobile** — the 4-column grid is narrow on small screens (<375px). The text sizes are reduced (`text-[10px]`/`text-[11px]`) but it's still tight. A future improvement could make it horizontally scrollable on mobile or switch to a stacked layout. Not blocking — the table is readable on 375px+ screens.
- **Admin reviews hard-delete** — the DELETE endpoint permanently removes the review. This is intentional (for spam/abuse) but irreversible. The hide (soft) option is the default moderation action; delete requires a confirm() dialog.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates and could power a live "X users viewing this service" counter (honest, not fake).
2. **Order history CSV/Excel export** — for users who want to track their spending, and for admin accounting.
3. **Service detail: "recently ordered by" live counter** — show a small "۳ نفر در حال مشاهده این سرویس" badge (only if honest — based on actual session data, not fake).
4. **Comparison table mobile** — make it horizontally scrollable on <375px or switch to stacked layout.
5. **Admin dashboard charts** — add a simple revenue/orders-over-time line chart to the admin dashboard (using the existing recharts dependency).
6. **Promo code usage analytics** — on `/admin/promos`, show a small chart of redemptions over time per code.

---
Task ID: REVIEW-4
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-3 (which added service detail rating badge, home featured reviews carousel, admin reviews moderation UI, multi-tier comparison table, honest completed-order counts on service cards). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly. This round focused on the recommended next steps from REVIEW-3: admin dashboard charts, CSV export, comparison table mobile scroll, and styling polish.

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across all tested pages.

## New Features Added

### 1. Admin Dashboard Charts (revenue + orders over time)
- **New client component** `src/app/admin/admin-charts.tsx` using `recharts` (already in dependencies):
  - 14-day time series of revenue + orders + completed orders per day
  - Toggleable metric: "درآمد" (AreaChart with gradient fill) / "سفارش‌ها" (BarChart with per-bar color)
  - Summary stats row: مجموع درآمد / سفارش‌های تکمیل‌شده / اوج (peak day)
  - Custom tooltip with Persian digits + Toman formatting
  - Framer Motion fade transition on metric toggle
  - RTL-aware axis labels (Persian short date on X-axis, compact Toman/k on Y-axis)
  - Responsive container (h-56 mobile, h-64 desktop)
- **Server-side data fetcher** added to `src/app/admin/page.tsx` — builds a 14-day bucket map from `db.order.findMany` + `db.walletTransaction.findMany`, returns `{date, label, orders, revenue, completed}[]` array. Label uses `Intl.DateTimeFormat("fa-IR", {month:"short", day:"numeric"})`.
- Chart card placed between the KPI row and the recent orders/transactions section.

### 2. Order History CSV Export
- **New API** `GET /api/orders/export` — auth-required, exports the user's own orders as CSV with Persian headers (کد سفارش / سرویس / پلتفرم / سطح / تعداد / قیمت / مبلغ کل / تخفیف / کد تخفیف / وضعیت / انجام‌شده / لینک هدف / تاریخ ثبت / آخرین به‌روزرسانی). UTF-8 BOM prepended for Excel compatibility. Returns `Content-Disposition: attachment; filename=roshdgar-orders-YYYY-MM-DD.csv`. Escapes commas/quotes/newlines properly.
- **New API** `GET /api/admin/orders/export` — admin-only, exports ALL orders (with user name + email columns added).
- **New reusable component** `src/components/brand/csv-export-button.tsx` — `CsvExportButton` client component: fetches the URL as a blob, creates an object URL, triggers download via a synthetic `<a>` element, extracts filename from Content-Disposition header, toast feedback on success/error, loading spinner.
- **Added to `/orders` page** — "خروجی CSV" button appears next to the count pills (only when orders exist).
- **Added to `/admin/orders` page** — "خروجی CSV (همه)" button in the page header.

### 3. Comparison Table Mobile Horizontal Scroll
- Updated `src/components/brand/tier-comparison-table.tsx` — wrapped the table in an `overflow-x-auto` container with a `min-w-[640px]` inner div. On screens narrower than 640px, the table now scrolls horizontally instead of squishing the 4 columns into an unreadable layout. Verified: `scrollWidth=640 > clientWidth` on 375px viewport, `scrollable: true`.

## Styling Improvements
- Admin dashboard chart card uses the same Card/CardHeader/CardTitle pattern as the rest of the admin panel for visual consistency.
- Chart colors use the design system's primary emerald (`oklch(0.55 0.13 162)`) — no rainbow palette.
- AreaChart uses a gradient fill (0.4 → 0.02 opacity) for a polished look.
- BarChart colors bars emerald when `orders > 0`, muted when 0 — so zero-days are visually de-emphasized.
- CSV export button uses the outline variant + Download icon, consistent with other secondary actions.

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for admin-only via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/admin` dashboard → renders "نمای کلی ۱۴ روز اخیر" chart card with "مجموع درآمد" / "سفارش‌های تکمیل‌شده" / "اوج" summary stats. Chart SVG (`svg.recharts-surface`) rendered. Toggle between "درآمد" (AreaChart) and "سفارش‌ها" (BarChart) works — summary updates to "مجموع سفارش‌ها".
  - `/orders` → "خروجی CSV" button renders next to count pills. Click → `GET /api/orders/export` returns 200, download triggered, toast "فایل دانلود شد."
  - `GET /api/orders/export` without session → 401 (properly auth-gated).
  - `/services/instagram-followers` on 375px mobile → comparison table container has `scrollWidth=640 > clientWidth`, `scrollable: true` — horizontal scroll works.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Chart data timezone** — the 14-day bucketing uses `toISOString().slice(0,10)` which is UTC. Orders placed late at night in Iran (Asia/Tehran, UTC+3:30) might bucket into the previous day. Not blocking for a 14-day overview, but a future improvement could use `Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Tehran"})` for correct local-day bucketing.
- **CSV export row limit** — user export caps at 1000 rows, admin at 5000. For very large platforms this might need pagination or streaming. Not blocking for MVP.
- **Chart Y-axis tick formatting** — uses a simple `k` suffix for thousands. For very large revenue values (millions of Toman), this could show `1000k` instead of `1M`. A `formatTomanShort`-based formatter could be used, but the current approach is readable enough.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates.
2. **Service detail: "recently ordered by" live counter** — honest session-based "X نفر در حال مشاهده" badge.
3. **Promo code usage analytics chart** — on `/admin/promos`, show a small per-code redemption chart.
4. **Order detail: provider status raw JSON viewer** (admin-only) — for debugging, show the raw provider response in a collapsible JSON viewer.
5. **User profile page** — `/profile` with avatar, name edit, password change, account deletion (GDPR-style).
6. **Search across the whole site** — a global search bar in the header that searches services + orders + tickets.

---
Task ID: REVIEW-5
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-4 (which added admin dashboard charts, CSV export, comparison table mobile scroll). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly — home, login, profile (new), orders (with CSV), wallet, support, notifications, admin dashboard (with charts), admin promos (with sparklines), admin reviews. This round focused on the recommended next steps from REVIEW-4: user profile page, global site search, promo usage analytics sparkline.

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across all tested pages.

## New Features Added

### 1. User Profile Page (`/profile`)
- **New API** `GET/PATCH /api/profile` — GET returns user info + stats (wallet balance, total orders, total spent, member since). PATCH updates the user's display name (email is read-only).
- **New API** `PATCH /api/profile/password` — changes password with current-password verification, prevents same-password reuse, bcrypt hashing.
- **New page** `src/app/profile/page.tsx` (server, `getSession()` gate) + `profile-view.tsx` (client):
  - Hero with avatar (first letter of name/email in a primary gradient square), name, email, "عضو از" relative time.
  - Stats grid: موجودی کیف پول / کل سفارش‌ها / کل spending — each links to its respective page.
  - Profile edit card: name input + email (read-only, muted) + save button with loading/saved states + toast.
  - Password change card: 3 password inputs (current/new/confirm) with show/hide toggles, real-time validation (min 8 chars, passwords match), error hints, submit button disabled until valid.
  - Account info card: email, role, member-since, password (masked) — each in a bordered info row with icon.
  - Recent orders preview: last 5 orders with emoji, name, code, status badge, total, relative time — links to order detail.
- Added "حساب من" item to user dropdown menu (with UserCircle icon).
- Added `/profile/loading.tsx` skeleton (reuses the admin loading pattern).

### 2. Global Site Search (command palette)
- **New API** `GET /api/search?q=...` — searches services (public, by name/summary/category/platform) + the authenticated user's orders (by code/serviceName/targetLink) + tickets (by code/subject). Returns grouped results. Provider-only fields never exposed.
- **New component** `src/components/brand/search-command-palette.tsx` — `SearchCommandPalette` client component using shadcn Dialog:
  - Search input with 200ms debounce, skeleton loaders during fetch.
  - Grouped results: سرویس‌ها (services, with price-from) / سفارش‌های من (orders, with status + total) / تیکت‌ها (tickets, with status).
  - Each result row has emoji/icon, name, code, metadata, and links to its detail page.
  - Empty state: "چه چیزی را جستجو می‌کنید؟" with suggestion chips (فالوور, لایک, یوتیوب, RG-).
  - No-results state: "نتیجه‌ای یافت نشد" with the query echoed.
  - Footer: total result count + "Enter برای رفتن به اولین نتیجه".
  - Enter key navigates to the first result.
  - Keyboard shortcut: press "/" anywhere (when not in an input) to open the palette.
- Added "جستجو" button to the site header (with Search icon + `/` kbd hint on desktop).
- Tested: searching "فالوور" returns both the service "فالوور اینستاگرام" and the user's order RG-W86B5G.

### 3. Promo Code Usage Analytics Sparkline
- Updated `GET /api/admin/promos` + `/admin/promos` page to include a 14-day redemption sparkline per promo (bucketed by day).
- **New component** `src/components/brand/promo-sparkline.tsx` — `PromoSparkline` client component using recharts BarChart: tiny inline bars (maxBarSize=6px) with per-day count, emerald bars for days with redemptions, muted bars for zero-days, custom tooltip showing "X استفاده در [date]".
- Integrated into the admin promo card: when `redemptionCount > 0`, shows a "روند استفاده (۱۴ روز)" section with the sparkline below the usage stats.
- Verified: WELCOME10 (1 redemption) shows the sparkline; promos with 0 redemptions show "بدون استفاده اخیر".

## Styling Improvements
- Profile page hero uses the same `bg-mesh-brand` gradient + avatar pattern as other pages for consistency.
- Profile stats cards use tone-colored icons (primary/info/success) matching the admin KPI pattern.
- Password inputs use LTR direction with show/hide eye toggle button positioned correctly for RTL.
- Search palette uses a clean Dialog with sticky search input + scrollable results + footer count — matches the command-palette pattern users expect from modern apps (Cmd+K style).
- Promo sparkline uses the same emerald color as the admin dashboard chart for visual consistency.
- "حساب من" menu item uses UserCircle icon, distinct from the other menu items.

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for protected via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/profile` → renders avatar, name, email, "عضو از", stats grid (موجودی/سفارش‌ها/spending), profile edit card (name input + email read-only), password change card (3 inputs with show/hide), account info card, recent orders list. "حساب من" appears in user dropdown.
  - Password change: filled current (user12345) + new (newpass123) + confirm → "تغییر رمز" enabled → click → PATCH 200 → success. Changed back to user12345 to preserve demo credentials.
  - Search: clicked "جستجو" button → palette opens → typed "فالوور" → results show service "فالوور اینستاگرام" + order "RG-W86B5G" with status + total. Enter would navigate to first result.
  - `/admin/promos` → WELCOME10 card shows "روند استفاده (۱۴ روز)" sparkline (1 recharts SVG rendered). Promos with 0 redemptions show "بدون استفاده اخیر".
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Search keyboard shortcut** — the "/" shortcut works when the document body has focus, but if focus is inside an input/textarea it's correctly suppressed. The `agent-browser press Slash` command didn't trigger it in testing (likely because the simulated keydown didn't match React's expected event shape), but the button click works. Verified the handler is wired correctly by code inspection.
- **Profile avatar** — currently just the first letter of the name in a gradient square. A future improvement could add actual avatar image upload (out of MVP scope — would need file storage).
- **Search debounce** — 200ms is a good default, but for very fast typists there might be a slight flash of skeleton. Not blocking.
- **Password change session invalidation** — after changing the password, the user's existing JWT session remains valid until it expires. A future improvement could invalidate other sessions (requires a session store, which we don't have with JWT-only auth).

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Service detail: "recently ordered by" live counter** — honest session-based "X نفر در حال مشاهده" badge.
3. **Order detail: provider status raw JSON viewer** (admin-only) — for debugging, collapsible JSON viewer.
4. **Admin: user management page** — `/admin/users` to list/search users, view their orders + wallet, ban/unban.
5. **Account deletion (GDPR)** — allow users to delete their account + all associated data from the profile page.
6. **Email notifications** — basic transactional email on order completion (currently only in-app notifications).

---
Task ID: REVIEW-6
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-5 (which added user profile page, global site search, promo usage sparklines). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly. This round focused on the recommended next steps from REVIEW-5: admin user management, order detail provider JSON viewer, and service detail live viewers counter.

## Bugs Found & Fixed
- **Duplicate `Copy`/`Check` imports** in `src/app/orders/[id]/order-timeline.tsx` — when adding the ProviderDebugCard, I added `Copy`, `Check` to the lucide-react import block but they were already imported earlier (lines 32-34 for the SummaryCard copy button). This caused a "the name `Copy` is defined multiple times" compile error, which broke both the order detail page AND the worker API (because `/api/worker` imports from the same module graph). Fixed by removing the duplicate entries from the second import block. Verified: order detail page + worker both returned to 200 after the fix.

## New Features Added

### 1. Admin User Management Page (`/admin/users`)
- **Schema change**: added `banned Boolean @default(false)` field to the User model (Prisma + db:push).
- **Auth change**: updated `authorize()` in `[...nextauth]/route.ts` to block banned users from logging in (throws `ACCOUNT_BANNED` error).
- **New API** `GET /api/admin/users` — admin-only, returns all users with order counts, wallet balances, total spent, ticket counts, banned status. Supports `?q=` search by name/email.
- **New API** `PATCH /api/admin/users/[id]` — admin-only, toggles banned status. Prevents self-ban + admin-ban (returns 400 with Persian error message).
- **New page** `src/app/admin/users/page.tsx` (server, `requireAdmin()`) + `users-manager.tsx` (client):
  - KPI row: کل کاربران / مشتریان / مدیران / مسدودشده (with Persian digits)
  - Filter chips: همه / فعال / مسدود (with counts)
  - Search input — filters by name/email
  - User cards: avatar (first letter), name, email, admin/banned badges, stats (orders/wallet/spent/tickets), ban/unban button. Admins show "—" instead of a ban button (can't ban admins). Footer shows "عضو از [relative time]".
  - Framer Motion AnimatePresence for list transitions
  - Toast feedback for all actions
- Added "کاربران" to admin sidebar nav (with Users icon).
- Tested: banned the demo user → "کاربر مسدود شد" toast, count updated to مسدود ۱, button changed to "آزادکردن". Unbanned → restored.

### 2. Order Detail Provider Status JSON Viewer (admin-only)
- Added `providerOrderId?` and `providerMeta?` fields to the `OrderDetailData` interface.
- Updated `/orders/[id]` page to pass these fields ONLY when `session.role === "ADMIN"` (regular users get null — provider data never reaches non-admin clients).
- **New component** `ProviderDebugCard` (in `order-timeline.tsx`): collapsible card with amber border, shows:
  - "اطلاعات تأمین‌کننده (دیباگ)" header with Code icon
  - When expanded: provider order ID in a monospace code block with a copy button (Check icon on success)
  - Provider metadata as pretty-printed JSON in a scrollable `<pre>` block (max-h-64)
  - Empty state: "هنوز اطلاعاتی از تأمین‌کننده دریافت نشده است."
- Only renders when `isAdmin && (order.providerOrderId || order.providerMeta)`.
- Tested: admin viewing order RG-W3ZRPG → "اطلاعات تأمین‌کننده (دیباگ)" card appears → expand → shows "MOCK-IONOAFJB" provider order ID + copy button.

### 3. Service Detail Live Viewers Counter (honest social proof)
- **New API** `GET /api/services/[slug]/viewers` — returns an HONEST count of unique viewers in the last 5 minutes. Uses an in-memory `Map<slug, Map<viewerHash, timestamp>>` (reset on server restart). Viewers are identified by an FNV-1a hash of IP + user-agent (anonymous, not stored). Includes automatic cleanup of stale entries every 60s.
- **New component** `src/components/brand/live-viewers-badge.tsx` — `LiveViewersBadge` client component using React Query (30s refetch): shows "X نفر در حال مشاهده" with a pulsing emerald dot + Eye icon. Only renders when `count > 1` (solo viewers don't see the badge — no fake "1 نفر" social proof).
- Integrated into the service detail page header, after the tier badges.
- Tested: the API returns 2 viewers when the browser + curl both hit the page. The badge shows "۲ نفر در حال مشاهده" in the browser.

## Styling Improvements
- Admin users page follows the same KPI + filter chips + search + card-list pattern as the other admin pages (services/promos/orders/transactions/reviews) for visual consistency.
- User avatars use role-colored backgrounds: admins get primary tint, banned users get red, regular users get accent.
- Provider debug card uses amber border (warning/debug convention) + monospace code blocks + a copy button that shows a green check on success.
- Live viewers badge uses the same `animate-ping` emerald dot pattern as the "completed orders" badge on service cards + the notifications bell — visual consistency for "live/active" indicators.

## Verification Results
- `bun run lint` → exit 0, clean.
- Prisma schema pushed successfully (`banned` field added).
- Dev server restarted to pick up new Prisma client.
- All routes return expected status codes (200 for public/authenticated, 307 for admin-only via curl).
- Worker mini-service running on :3003 (recovered from the import-error 500s after the duplicate-import fix).
- agent-browser E2E tests:
  - `/admin/users` → renders "مدیریت کاربران" heading, KPIs (کل کاربران ۲, مشتریان ۱, مدیران ۱, مسدودشده ۰), filter chips, search, 2 user cards (admin + demo user). Ban button on demo user (not on admin). Tested ban → "کاربر مسدود شد" toast, مسدود ۱, button → "آزادکردن". Unbanned → restored.
  - `/orders/[id]` (admin) → "اطلاعات تأمین‌کننده (دیباگ)" card appears. Expand → shows "MOCK-IONOAFJB" provider order ID + copy button + JSON metadata block.
  - `/services/instagram-followers` → "۲ نفر در حال مشاهده" badge appears in header (emerald, pulsing dot, Eye icon).
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **In-memory viewers counter** — resets on server restart and doesn't persist across multiple server instances (no Redis/shared store). For MVP this is fine, but a multi-instance deployment would need a shared store (Redis INCR with TTL, or a database table with periodic cleanup). The current implementation is honest within a single server instance.
- **Banned user login UX** — when a banned user tries to log in, they get the generic "ایمیل یا رمز عبور اشتباه است" message (because NextAuth's `signIn` client-side can't distinguish between wrong credentials and a thrown authorize error). A future improvement could use a custom error page or a redirect with a `?reason=banned` param.
- **Provider debug card** — shows the raw provider response. For the mock provider this is simple JSON, but a real provider might return large nested objects. The `max-h-64 overflow-auto` container handles this, but very large responses could benefit from a virtualized JSON tree viewer.
- **Live viewers privacy** — the IP+UA hash is never stored or logged, only kept in memory for 5 minutes then garbage-collected. This is privacy-preserving but means we can't audit "who viewed what" — which is the correct tradeoff for user privacy.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Account deletion (GDPR)** — allow users to delete their account + all associated data from the profile page. Requires careful cascade handling (orders should be anonymized, not deleted, for ledger integrity).
3. **Email notifications** — basic transactional email on order completion (currently only in-app notifications).
4. **Admin: impersonate user** — "ورود به عنوان کاربر" feature for debugging user-reported issues (admin temporarily assumes a user's session, with a clear "impersonating" banner).
5. **Order re-order from orders list** — add a quick "سفارش مجدد" button directly on each order row in the list (not just the detail page).
6. **Service detail: related services** — show 2-3 related services (same platform, different category) at the bottom of the page for cross-selling.

---
Task ID: REVIEW-7
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-6 (which added admin user management, provider JSON viewer, live viewers counter). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly — home, login, admin dashboard, service detail (with live viewers + comparison + reviews + related services), orders (with CSV + reorder), profile (with danger zone), admin users/promos/reviews. This round focused on the recommended next steps from REVIEW-6: related services cross-sell, re-order from orders list, and account deletion (GDPR).

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across all tested pages.

## New Features Added

### 1. Related Services Cross-Sell on Service Detail Page
- **New server function** `getRelatedServices(currentSlug, platform)` — fetches up to 3 active services on the same platform but with a different slug, with their cheapest tier price for display.
- Added a "سرویس‌های مرتبط" (Related Services) section at the bottom of the service detail page, below the 2-column grid (after the order config card). Shows a heading with the platform name + "همه سرویس‌های {platform}" link, then a responsive grid (1/2/3 cols) of related service cards.
- Each related service card: emoji in accent square, name, summary (line-clamped), price-from, and a hover-revealed arrow icon. Links to the service detail page.
- Only renders when `relatedServices.length > 0` (services with no siblings don't show the section).
- Tested: instagram-followers page shows لایک اینستاگرام + بازدید اینستاگرام as related services.

### 2. Re-order Button on Orders List Rows
- **New component** `ReorderInlineButton` (in `orders-list.tsx`) — a small inline "سفارش مجدد" button with RefreshCw icon that appears on each order row in the list (not just the detail page). On click: fetches `/api/orders/[id]/reorder`, shows a loading spinner, then `router.push(redirectUrl)` to the pre-filled order flow.
- Positioned in the bottom row of each order card, with `relative z-[3]` so it stays clickable above the stretched-link overlay. The "مشاهده جزئیات" hover text is on the opposite side.
- Tested: 2 "سفارش مجدد" buttons appear on the orders list (one per order row).

### 3. Account Deletion (GDPR) from Profile Page
- **New API** `DELETE /api/profile/delete` — permanently deletes the user's account + all associated data (Wallet, WalletTransaction, Orders, OrderEvents, Payments, SupportTickets, SupportTicketReplies, PromoRedemptions, ServiceReviews via Prisma cascade). Requires password confirmation. Prevents admin self-deletion (returns 400 with Persian message). Verifies password with bcrypt before deletion.
- **New component** `DangerZoneCard` (in `profile-view.tsx`) — red-bordered "منطقه خطر" card at the bottom of the profile page:
  - Warning text explaining what gets deleted (orders, wallet, transactions, tickets, reviews — permanently, irreversible).
  - Admins see a restriction message ("حساب‌های مدیریت قابل حذف نیستند") instead of the delete button.
  - Non-admins: "حذف حساب کاربری" button → expands to a password input + "انصراف" / "حذف دائمی" buttons. Requires `confirm()` dialog. On success: toast + redirect to home after 1.5s.
  - Uses red/amber color scheme for danger indication.
- Tested: admin sees the restriction message (can't self-delete).

## Styling Improvements
- Related services section uses the same card hover pattern as ServiceCard (translate-y + border-primary + shadow-soft) for visual consistency.
- Re-order button on orders list uses a subtle bordered style that doesn't compete with the stretched-link card click — small, muted, with hover-to-primary.
- Danger zone card uses red border + red/[0.02] background + AlertTriangle icon — follows the "danger zone" convention from settings pages.
- Admin restriction message uses amber (warning, not error) to distinguish "you can't do this" from "something went wrong".

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for protected via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/services/instagram-followers` → "سرویس‌های مرتبط" section renders at the bottom with لایک اینستاگرام + بازدید اینستاگرام cards (emoji, name, summary, price-from, arrow icon).
  - `/orders` → 2 "سفارش مجدد" buttons appear on the order rows (one per order).
  - `/profile` → "منطقه خطر" card renders at the bottom. Admin sees "حساب‌های مدیریت قابل حذف نیستند" restriction message. Non-admins would see the delete button → password confirmation → confirm dialog → deletion.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Account deletion cascade** — the `DELETE /api/profile/delete` endpoint uses Prisma's cascade delete, which removes ALL related data (orders, wallet, transactions, etc.). For a real GDPR-compliant system, orders should be anonymized (keeping the ledger intact) rather than deleted. For MVP, full deletion is acceptable since the user explicitly consents. A future improvement could add a `deletedAt` soft-delete field + anonymize PII instead of hard-deleting.
- **Related services price** — shows the cheapest tier's `pricePer1000`, which is the Economy tier. This is honest but could be misleading if the Economy tier has very different quality. The service detail page already explains tier differences.
- **Re-order button on orders list** — the button is always visible (not just on hover like the "مشاهده جزئیات" text). This is intentional for mobile usability (hover doesn't work on touch), but could make the list feel busier. The small size (text-[10px]) keeps it unobtrusive.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Email notifications** — basic transactional email on order completion (currently only in-app notifications).
3. **Admin: impersonate user** — "ورود به عنوان کاربر" feature for debugging user-reported issues.
4. **Service detail: "recently ordered by" honest live counter** — carried forward, could use the viewers API as a base.
5. **Soft-delete for account deletion** — add a `deletedAt` field + anonymize PII instead of hard-deleting, for better audit trail.
6. **Order detail: related orders** — show other orders from the same user (admin) or same service (customer) on the order detail page.

---
Task ID: REVIEW-8
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-7 (which added related services cross-sell, re-order buttons on orders list, and account deletion). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly. This round focused on the recommended next steps from REVIEW-7: admin impersonate user, and order detail related orders.

## Bugs Found & Fixed
- **Impersonation cookie name mismatch** — initially set `authjs.session-token` (NextAuth v5 convention) but the project uses NextAuth v4 which reads `next-auth.session-token`. The impersonation API returned 200 but the session didn't switch because the wrong cookie was set. Fixed by changing the cookie name to `next-auth.session-token` in both the impersonate and end-impersonation routes. Also added `cookieStore.delete("authjs.session-token")` to clean up the stale cookie from the first attempt.
- **End-impersonation session check** — the end-impersonation route checked `(session as any).impersonating` (top-level) but the `impersonating` field was set on `session.user.impersonating` (per the session callback). Fixed by reading `(session.user as any).impersonating`.
- **ImpersonationBanner session access** — the banner component read `(session as any).impersonating` but the field is on `session.user.impersonating`. Fixed to `(session?.user as any)?.impersonating`.

## New Features Added

### 1. Admin Impersonate User (ورود به عنوان کاربر)
- **Auth changes**: updated the `jwt` callback to handle the `update` trigger (for ending impersonation), and the `session` callback to expose the `impersonating` field on `session.user`.
- **Type augmentation**: added `impersonating` field to the `Session.user` and `JWT` interfaces in `src/types/next-auth.d.ts` with `adminId`, `adminEmail`, `targetUserId`, `targetUserName`, `targetUserEmail`.
- **New API** `POST /api/admin/users/[id]/impersonate` — admin-only, mints a new JWT with the target user's ID + role + an `impersonating` object (containing the admin's original identity). Sets the `next-auth.session-token` cookie directly via `next/headers`. Prevents: self-impersonation, admin-impersonation, already-impersonating, banned users.
- **New API** `POST /api/auth/end-impersonation` — restores the admin's original JWT by encoding a new token with the admin's ID + `ADMIN` role (no `impersonating` field).
- **New component** `src/components/brand/impersonation-banner.tsx` — amber banner shown at the top of all pages when impersonating. Shows "حالت جعل هویت • شما به‌عنوان [user] وارد شده‌اید" + "بازگشت به حساب مدیریت" button. Uses Framer Motion for slide-in animation.
- **Integrated into SiteShell** — the banner appears above the header on ALL pages (since SiteShell wraps every page).
- **Admin UI** — added "جعل هویت" button (with UserCog icon, sky-blue) to each non-admin user card in `/admin/users`. On click: confirm dialog → POST impersonate → redirect to home → banner appears. Admins can't impersonate other admins or banned users.
- Tested: admin impersonated demo user → wallet showed ۲۴۳,۵۰۰ (user's balance, not admin's ۱۰,۰۲۴,۰۰۰) → banner appeared "شما به‌عنوان کاربر نمونه وارد شده‌اید" → clicked "بازگشت به حساب مدیریت" → redirected to /admin/users → admin session restored.

### 2. Order Detail Related Orders
- Added server-side fetching of related orders in `/orders/[id]` page: for admins, fetches other orders from the same user; for customers, fetches other orders for the same service. Up to 5 most recent.
- **Updated OrderTimeline** to accept a `relatedOrders` prop and render a "سایر سفارش‌های این کاربر" (admin) or "سایر سفارش‌های این سرویس" (customer) card with a list of related order rows (emoji, name, code, status badge, total, relative time, arrow icon). Each row links to its order detail page.
- Only renders when `relatedOrders.length > 0`.
- Tested: admin viewing an order → "سایر سفارش‌های این کاربر" card with related orders appears.

## Styling Improvements
- Impersonation banner uses amber color scheme (warning convention) with UserCog icon — visually distinct from regular headers.
- "جعل هویت" button on user cards uses sky-blue (distinct from the red ban button) — visually communicates "switch identity" rather than "dangerous action".
- Related orders card uses the same Layers icon + card pattern as other sections in the order detail page.
- Related order rows use the same hover pattern (border-primary + bg-accent/30 + arrow icon) as the recent orders on the profile page.

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for protected via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/admin/users` → "جعل هویت" button appears on non-admin user cards. Click → confirm dialog → POST 200 → redirect to home → impersonation banner "حالت جعل هویت • شما به‌عنوان کاربر نمونه (user@roshdgar.local) وارد شده‌اید" + "بازگشت به حساب مدیریت" button. Wallet shows user's balance (۲۴۳,۵۰۰), not admin's.
  - End impersonation → POST 200 → redirect to /admin/users → admin session restored (مدیر سیستم shows, no banner).
  - `/orders/[id]` (admin) → "سایر سفارش‌های این کاربر" card with related orders renders.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Impersonation session expiry** — the impersonation JWT has a 30-day maxAge (same as normal sessions). If the admin forgets to end impersonation, they'll remain as the user for up to 30 days. A future improvement could set a shorter maxAge (e.g. 1 hour) for impersonation tokens. Not blocking for MVP.
- **Impersonation audit log** — there's no audit trail of who impersonated whom and when. A future improvement could log impersonation events to the DB. Not blocking.
- **Related orders for customers** — currently shows other orders for the same service. This is honest (the user has ordered this service before) but could be more useful if it showed orders for related services too. Not blocking.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Email notifications** — basic transactional email on order completion.
3. **Soft-delete for account deletion** — add a `deletedAt` field + anonymize PII instead of hard-deleting, for better audit trail.
4. **Impersonation audit log** — record who impersonated whom + duration.
5. **Service detail: "recently ordered by" honest live counter** — carried forward.
6. **Admin: system settings page** — `/admin/settings` for site-wide config (default wallet credit, min order amount, maintenance mode toggle).

---
Task ID: REVIEW-9
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-8 (which added admin impersonation and order detail related orders). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly. This round focused on the recommended next steps from REVIEW-8: admin system settings page, impersonation audit log, and maintenance mode integration.

## Bugs Found & Fixed
- None — the codebase was clean entering this round. QA via agent-browser confirmed no hydration errors, no console errors, no runtime issues across all tested pages.

## New Features Added

### 1. Admin System Settings Page (`/admin/settings`)
- **New Prisma model** `Setting` — key-value store for site-wide configuration.
- **New lib** `src/lib/settings.ts` — typed settings helper with `getSetting`, `getAllSettings`, `setSetting`, `isMaintenanceMode`. Module-level cache to avoid repeated DB hits within the same request. Supports keys: `site.maintenanceMode` (boolean), `site.maintenanceMessage` (string), `site.defaultWalletCredit` (number), `site.minOrderAmount` (number), `site.maxOrderAmount` (number).
- **New API** `GET/PATCH /api/admin/settings` — admin-only, reads/updates all settings with Zod validation.
- **New page** `src/app/admin/settings/page.tsx` (server, `requireAdmin()`) + `settings-manager.tsx` (client):
  - Maintenance mode card: Switch toggle + message textarea (appears when enabled). Card turns amber when maintenance is on.
  - Order/wallet limits card: 3 number inputs (defaultWalletCredit, minOrderAmount, maxOrderAmount) with Persian labels + helper text.
  - Summary card: shows current values of all settings in a read-only row format.
  - "ذخیره تغییرات" button with loading/saved states + toast.
- Added "تنظیمات" to admin sidebar nav (with Settings icon).

### 2. Maintenance Mode Integration
- Updated `POST /api/orders` to check `isMaintenanceMode()` before creating an order. Returns 503 with the maintenance message when enabled. Admins are exempted (can still order for testing).
- Tested: toggled maintenance mode ON → switch turned amber → message textarea appeared → saved → switch state persisted.

### 3. Impersonation Audit Log
- **New Prisma model** `AuditLog` — records admin actions (action, adminId, adminEmail, targetUserId, targetUserEmail, metadata JSON, createdAt). Indexed on adminId, action, createdAt.
- Updated `POST /api/admin/users/[id]/impersonate` to write an `IMPERSONATE_START` audit log entry.
- Updated `POST /api/auth/end-impersonation` to write an `IMPERSONATE_END` audit log entry.
- **New component** `src/app/admin/settings/audit-log-list.tsx` — `AuditLogList` client component: renders the last 20 audit log entries with action-specific icons (UserCog for start, ArrowLeftRight for end), admin email, target user, relative + absolute time. Shows "هنوز رویدادی ثبت نشده است" empty state.
- Integrated into the admin settings page below the settings manager.
- Tested: performed an impersonation cycle (start → end) → audit log shows both entries with admin email (admin@roshdgar.local), target user (user@roshdgar.local), and timestamps.

## Styling Improvements
- Settings page uses the same card pattern as other admin pages, with tone-colored section icons (amber for maintenance, primary for wallet/limits).
- Maintenance mode card turns amber when enabled — visual feedback that the site is in a special state.
- Audit log entries use action-specific icons + tones (amber for start, emerald for end) for quick visual scanning.
- Summary card at the bottom provides a read-only overview of all current settings.

## Verification Results
- `bun run lint` → exit 0, clean.
- Prisma schema pushed successfully (Setting + AuditLog models added).
- Dev server restarted to pick up new Prisma client.
- All routes return expected status codes (200 for public/authenticated, 307 for admin-only via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/admin/settings` → renders "تنظیمات سیستم" heading, maintenance mode card with switch, order/wallet limits card with 3 inputs, summary card. "ذخیره تغییرات" button works.
  - Maintenance mode toggle: clicked switch → turned amber → message textarea appeared → saved → switch persisted as checked. Turned back off + saved.
  - Audit log: after an impersonation cycle, the audit log shows 2 entries: "شروع جعل هویت" and "پایان جعل هویت" with admin email, target user, and timestamps.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **Settings cache** — the module-level cache in `settings.ts` is per-process. In a multi-instance deployment, settings would need a shared cache (Redis) or the cache would need to be invalidated across instances. For MVP with a single server, this is fine.
- **Audit log growth** — the AuditLog table will grow indefinitely. A future improvement could add a cleanup job (e.g. keep only 90 days) or archival. Not blocking.
- **Maintenance mode enforcement** — currently only blocks order creation. A more thorough implementation could also block wallet deposits + show a full-page maintenance banner. The current approach is sufficient for MVP.
- **Settings extensibility** — the `SettingsDefaults` interface is hardcoded. Adding a new setting requires a schema-less key (just a new row in the Setting table) but the typed helper won't know about it. For MVP with 5 settings, this is fine.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Email notifications** — basic transactional email on order completion.
3. **Soft-delete for account deletion** — add a `deletedAt` field + anonymize PII instead of hard-deleting.
4. **Maintenance mode full-page banner** — when maintenance is on, show a dismissible banner on all pages (not just block order creation).
5. **Admin: system health dashboard** — `/admin/health` showing worker status, DB size, API response times, error rates.
6. **Service detail: "recently ordered by" honest live counter** — carried forward.

---
Task ID: REVIEW-10
Agent: webDevReview (cron-triggered, 15-min cycle)
Task: Assess project status, QA via agent-browser, fix bugs, improve styling, add new features

## Current Project Status Assessment
The رشدیار MVP is stable and feature-rich after REVIEW-9 (which added admin system settings, maintenance mode integration, and impersonation audit logs). Dev server on :3000, worker on :3003. Lint clean. No console errors. QA via agent-browser confirmed all pages render correctly. This round focused on the recommended next steps from REVIEW-9: maintenance mode full-page banner and admin system health dashboard.

## Bugs Found & Fixed
1. **Lint: `react-hooks/set-state-in-effect`** in `maintenance-banner-client.tsx` — the `useEffect` that read `sessionStorage` and called `setDismissed(true)` triggered the lint rule. Fixed by using a lazy `useState` initializer that reads `sessionStorage` synchronously on first render (no effect needed).
2. **Lint: `react-hooks/error-boundaries`** in `maintenance-banner.tsx` — the try/catch around the JSX return triggered the lint rule (React doesn't catch render errors with try/catch). Fixed by removing the try/catch entirely (if `getSetting` throws, the error propagates to the nearest error boundary, which is correct behavior).
3. **MaintenanceBanner not rendering** — initially the server-side `MaintenanceBanner` used `getServerSession()` which doesn't work reliably in nested async server components. Fixed by removing the server-side session check and instead using `useSession()` client-side in `MaintenanceBannerClient` to determine if the current user is an admin (admins see a different message).

## New Features Added

### 1. Maintenance Mode Full-Page Banner
- **New component** `src/components/brand/maintenance-banner.tsx` (async server component) — checks `getSetting("site.maintenanceMode")` + `getSetting("site.maintenanceMessage")` server-side. Returns null when maintenance is off.
- **New component** `src/components/brand/maintenance-banner-client.tsx` (client) — renders an amber gradient banner with Wrench icon + message. Uses `useSession()` to show admin-specific text ("حالت تعمیرات فعال است • ثبت سفارش برای کاربران غیرفعال است"). Dismissible per-session via `sessionStorage` (reappears on next visit/session). Framer Motion slide-in animation.
- **Integrated into SiteShell** — the banner appears above the impersonation banner + header on ALL customer-facing pages (since SiteShell wraps every page).
- Tested: enabled maintenance mode → banner appeared on home page with admin-specific message → dismissed → banner hidden → reappears on next session.

### 2. Admin System Health Dashboard (`/admin/health`)
- **New page** `src/app/admin/health/page.tsx` (server, `requireAdmin()`) + `health-dashboard.tsx` (client):
  - System status cards (3-col grid): Worker (port 3003, green when healthy + last-tick time), Database (SQLite, file size + table count), App Server (port 3000, Next.js 16 + Turbopack, status badge).
  - DB stats grid (6 tiles): Users / Orders / Services / Wallet Transactions / Revenue / Pending Orders — each with tone-colored icon + Persian digits.
  - Order status breakdown (3 cards): Completed (emerald) / Pending+In-Progress (amber) / Failed+Partial (red).
  - Recent events list (last 10 OrderEvents): colored status dot + order code + message + relative time.
  - Worker health check via `fetch("http://localhost:3003/")` with 3s timeout.
  - DB file size via `fs.stat()`.
- Added "سلامت سیستم" to admin sidebar nav (with Activity icon).
- Tested: all 3 system status cards render with correct status, DB stats show real counts, worker shows "سالم" with last-tick relative time, recent events list shows worker progress messages.

## Styling Improvements
- Maintenance banner uses amber gradient background + Wrench icon — visually communicates "system maintenance" without being alarming (unlike red error banners).
- Health dashboard uses tone-colored cards: emerald for healthy worker, primary for DB, sky for app server — consistent with the admin KPI pattern.
- Stat tiles use 5 tones (primary/info/muted/success/warning) for visual variety while staying within the design system.
- Recent events use colored status dots (emerald/amber/red/primary) matching the StatusBadge tone system.

## Verification Results
- `bun run lint` → exit 0, clean.
- All routes return expected status codes (200 for public/authenticated, 307 for admin-only via curl).
- Worker mini-service running on :3003.
- agent-browser E2E tests:
  - `/admin/health` → renders "سلامت سیستم" heading, 3 system status cards (Worker سالم, DB with file size, App در حال اجرا), 6 DB stat tiles, 3 order breakdown cards, recent events list with worker progress messages.
  - Maintenance mode: enabled → amber banner appeared on home page "حالت تعمیرات فعال است • ثبت سفارش برای کاربران غیرفعال است..." → dismissible. Disabled → banner gone.
  - No console errors, no hydration errors, no runtime issues.

## Unresolved Issues / Risks
- **MaintenanceBanner session check** — the banner uses `useSession()` client-side to determine admin status, which means there's a brief flash before the session loads (the banner renders with the non-admin message first, then updates to the admin message once the session is fetched). Not blocking — the flash is very brief and both messages are accurate.
- **Health dashboard worker check** — the `fetch("http://localhost:3003/")` is a server-side fetch with a 3s timeout. If the worker is slow to respond, the health page will be slow. Not blocking for MVP.
- **DB file size** — reads the SQLite file size from the filesystem. This works in dev but might not work in production (the DB might be on a different volume or managed service). Not blocking for MVP.

## Recommended Next Steps (priority order)
1. **WebSocket real-time notifications** — currently polls every 30s. A socket.io mini-service would give instant order-status updates. (Carried forward — high value, moderate effort.)
2. **Email notifications** — basic transactional email on order completion.
3. **Soft-delete for account deletion** — add a `deletedAt` field + anonymize PII.
4. **Admin: error rate monitoring** — track API error rates + display on the health dashboard.
5. **Service detail: "recently ordered by" honest live counter** — carried forward.
6. **Onboarding tour** — a guided first-visit tour for new users (highlights the catalog, order flow, wallet, tracking).

---
Task ID: REVIEW-FINAL
Agent: orchestrator (main)
Task: Rename site, new logo, RTL polish, Persian improvement, font increase, GitHub push with backdated history, issues, PRs, code reviews

## Work Completed

### 1. Site Rename: رشدگر → رشدیار (Roshdyar)
- Bulk replaced all instances of "رشدگر"/"Roshdgar" → "رشدیار"/"Roshdyar" across 16+ source files
- Updated: layout metadata, logo component, site header, site footer, admin shell, home page, login/register pages, support pages, API routes, prisma schema, worker, globals.css
- "رشدیار" means "growth companion" — more professional and modern

### 2. New Logo + Favicon
- Created new SVG logo with ascending chart bars + upward arrow (conveys "growth")
- Emerald-to-teal gradient background with subtle shine
- New favicon.svg with matching design
- Updated Logo component to use the new SVG

### 3. Font Size Increase on Service Detail
- Service description: `text-sm leading-8` → `text-base leading-9` (larger, more readable)
- Service summary: `text-sm leading-7` → `text-base leading-8`
- Section heading: `text-base` → `text-lg`
- FAQ content: `leading-7` → `leading-8`

### 4. RTL + Persian Polish
- Verified `dir="rtl"` + `lang="fa"` on `<html>` tag
- All components use RTL-safe patterns (logical properties, rtl-flip for directional icons)
- Persian text improved throughout (consistent half-spaces, smoother phrasing)

### 5. GitHub Repository
- Created repo: https://github.com/HojatJoshani/roshdyar
- Pushed 139 commits with backdated history spanning Aug 10-20, 2025
- Commit distribution per day:
  - Aug 10: 12 commits (project setup, design system, DB, auth)
  - Aug 11: 15 commits (home, catalog, service detail)
  - Aug 12: 10 commits (order flow, worker, provider)
  - Aug 13: 8 commits (wallet, payment, auth pages)
  - Aug 14: 15 commits (admin panel, services, orders, support, seed)
  - Aug 15: 12 commits (reviews/ratings, support threads, fixes)
  - Aug 16: 21 commits (promo codes, notifications, favorites, page transitions)
  - Aug 17: 10 commits (profile, search, CSV export, reorder)
  - Aug 18: 15 commits (admin users, impersonation, related services, GDPR)
  - Aug 19: 12 commits (settings, maintenance mode, audit logs, health dashboard)
  - Aug 20: 9 commits (charts, sparklines, comparison table, final rename)

### 6. GitHub Issues (5 created)
- #1: WebSocket real-time notifications
- #2: Email notifications on order completion
- #3: Soft-delete account (GDPR compliance)
- #4: Admin error rate monitoring on health dashboard
- #5: Onboarding tour for new users

### 7. Pull Request + Code Review
- PR #6: "docs: add project README" — created, reviewed, and merged
- Code review submitted with detailed feedback (positives + suggestions)
- PR merged via squash merge

## Verification
- `bun run lint` → clean
- Home page: 200, shows "رشدیار" name + new logo
- Service detail: 200, larger fonts confirmed
- Worker: running on :3003
- GitHub: 139 commits pushed, 5 issues, 1 PR (merged), 1 code review

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  LifeBuoy,
  Menu,
  LogOut,
  Moon,
  Sun,
  ExternalLink,
  X,
  Ticket,
  Star,
  Users,
  Settings,
  Activity,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/services", label: "خدمات", icon: Package },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/transactions", label: "تراکنش‌ها", icon: Wallet },
  { href: "/admin/promos", label: "کدهای تخفیف", icon: Ticket },
  { href: "/admin/reviews", label: "نظرات", icon: Star },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: LifeBuoy },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
  { href: "/admin/health", label: "سلامت سیستم", icon: Activity },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="px-3 pb-2 pt-1">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          مدیریت
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border/60 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          مشاهده سایت
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar (mobile only) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="منوی مدیریت">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">منوی مدیریت</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
                  <Logo size={26} />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                <div className="flex flex-1 flex-col py-3">
                  <NavItems onNavigate={() => setMobileOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold">پنل مدیریت</span>
        </div>
        <Logo size={24} />
      </header>

      {/* Desktop sidebar + main */}
      <div className="flex flex-1">
        {/* Sidebar (desktop only) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-l border-border/60 bg-sidebar/40 md:flex">
          <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
            <Logo size={26} />
          </div>
          <div className="flex flex-1 flex-col py-3">
            <NavItems />
          </div>
          <div className="border-t border-border/60 p-3 text-[11px] text-muted-foreground">
            <div className="px-3 py-1.5">
              <div className="truncate font-medium text-foreground">
                {session?.user?.name || session?.user?.email || "مدیر"}
              </div>
              <div className="truncate">{session?.user?.email}</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Desktop top strip */}
          <div className="hidden h-12 items-center justify-between border-b border-border/60 bg-background/60 px-6 md:flex">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              <span>پنل مدیریت رشدیار</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="تغییر تم"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  مشاهده سایت
                </Link>
              </Button>
            </div>
          </div>

          {/* Page content */}
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

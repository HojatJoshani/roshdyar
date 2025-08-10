"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Menu,
  Moon,
  Sun,
  Wallet,
  User as UserIcon,
  UserCircle,
  LogOut,
  LayoutDashboard,
  Instagram,
  Youtube,
  ShoppingBag,
  LifeBuoy,
  Settings,
  Bell,
  CheckCheck,
  Heart,
  Search,
} from "lucide-react";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useNotifications } from "@/hooks/use-notifications";
import { formatToman, formatRelativeTime, toFaDigits } from "@/lib/format";
import { useState, useEffect } from "react";
import { SearchCommandPalette } from "@/components/brand/search-command-palette";

const NAV = [
  { href: "/services/instagram", label: "اینستاگرام", icon: Instagram },
  { href: "/services/youtube", label: "یوتیوب", icon: Youtube },
  { href: "/orders", label: "سفارش‌ها", icon: ShoppingBag, auth: true },
  { href: "/wallet", label: "کیف پول", icon: Wallet, auth: true },
  { href: "/support", label: "پشتیبانی", icon: LifeBuoy },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { balance, isLoading } = useWalletBalance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { notifications, unread, markAllRead, isMarking } = useNotifications();

  // Global "/" keyboard shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Right (logo) in RTL */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center" aria-label="رشدیار">
            <Logo />
          </Link>
        </div>

        {/* Center nav (desktop) */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.filter((n) => !n.auth || session).map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {item.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Left: search, theme toggle, wallet, account */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            aria-label="جستجو"
            onClick={() => setSearchOpen(true)}
            className="h-9 gap-2 px-2.5 text-muted-foreground"
          >
            <Search className="h-[18px] w-[18px]" />
            <span className="hidden text-sm sm:inline">جستجو</span>
            <kbd className="hidden shrink-0 rounded border border-border bg-muted/40 px-1 py-0.5 text-[9px] font-mono text-muted-foreground lg:block">
              /
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تغییر تم"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="اعلان‌ها"
                  className="relative h-9 w-9"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                      {toFaDigits(unread > 9 ? "۹+" : unread)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
                  <span className="text-sm font-semibold text-foreground">
                    اعلان‌ها
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      disabled={isMarking}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3 w-3" />
                      خواندن همه
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-10 text-center">
                      <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        اعلانی ندارید.
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 12).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        asChild
                        className="cursor-pointer p-0"
                      >
                        <Link
                          href={`/orders/${n.orderId}`}
                          className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-accent/50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base">
                            {n.orderEmoji}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="tnum text-[11px] font-semibold tabular-nums text-foreground">
                                {n.orderCode}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                              {n.message}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <div className="border-t border-border/60 p-1.5">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-center text-xs">
                    <Link href="/notifications">مشاهده همه اعلان‌ها</Link>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {session && (
            <Link href="/wallet" className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="tnum font-semibold tabular-nums">
                  {isLoading ? "…" : formatToman(balance)}
                </span>
                <span className="text-xs text-muted-foreground">تومان</span>
              </div>
            </Link>
          )}

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-lg pl-2 pr-2.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {(session.user?.name || session.user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">
                    {session.user?.name || "حساب من"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {session.user?.name || "کاربر"}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {session.user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer">
                    <ShoppingBag className="h-4 w-4" />
                    سفارش‌های من
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer">
                    <Wallet className="h-4 w-4" />
                    کیف پول
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support" className="cursor-pointer">
                    <LifeBuoy className="h-4 w-4" />
                    پشتیبانی
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="cursor-pointer">
                    <Bell className="h-4 w-4" />
                    اعلان‌ها
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="cursor-pointer">
                    <Heart className="h-4 w-4" />
                    علاقه‌مندی‌ها
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="h-4 w-4" />
                    حساب من
                  </Link>
                </DropdownMenuItem>
                {session.user?.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        پنل مدیریت
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link href="/login">ورود</Link>
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link href="/register">ثبت‌نام</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:hidden"
                aria-label="منو"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border/60 px-4">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto p-3">
                  {NAV.filter((n) => !n.auth || session).map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                  {session?.user?.role === "ADMIN" && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        پنل مدیریت
                      </Link>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Link
                      href="/notifications"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    >
                      <Bell className="h-4 w-4" />
                      اعلان‌ها
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    >
                      <Heart className="h-4 w-4" />
                      علاقه‌مندی‌ها
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <SearchCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

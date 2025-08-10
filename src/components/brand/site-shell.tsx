import { SiteHeader } from "@/components/brand/site-header";
import { SiteFooter } from "@/components/brand/site-footer";
import { PageTransition } from "@/components/brand/page-transition";
import { ImpersonationBanner } from "@/components/brand/impersonation-banner";
import { MaintenanceBanner } from "@/components/brand/maintenance-banner";
import { cn } from "@/lib/utils";

export async function SiteShell({
  children,
  className,
  hideFooter = false,
}: {
  children: React.ReactNode;
  className?: string;
  hideFooter?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MaintenanceBanner />
      <ImpersonationBanner />
      <SiteHeader />
      <main className={cn("flex-1", className)}>
        <PageTransition>{children}</PageTransition>
      </main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}

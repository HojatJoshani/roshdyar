import { getSetting } from "@/lib/settings";
import { MaintenanceBannerClient } from "./maintenance-banner-client";

/**
 * Server-side wrapper that checks if maintenance mode is on and renders
 * the banner. Does NOT check the session server-side (getServerSession
 * doesn't work reliably in nested async components). The client component
 * reads the session via useSession() to determine the admin message.
 */
export async function MaintenanceBanner() {
  const [maintenanceMode, maintenanceMessage] = await Promise.all([
    getSetting("site.maintenanceMode"),
    getSetting("site.maintenanceMessage"),
  ]);

  if (!maintenanceMode) return null;

  return <MaintenanceBannerClient message={maintenanceMessage} />;
}

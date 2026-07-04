import { portalApi, PortalApiError } from "@/lib/portal-api";

/** Validates portal session with the server. */
export async function validatePortalSession(): Promise<boolean> {
  try {
    await portalApi.me();
    return true;
  } catch (err) {
    if (err instanceof PortalApiError && err.status === 401) {
      return false;
    }
    return false;
  }
}

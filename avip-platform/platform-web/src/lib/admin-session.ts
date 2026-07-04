import { adminApi, ApiError } from "@/lib/api";
import { clearSession, isAuthenticated } from "@/lib/auth";

/** Validates token with the server; clears session on failure. */
export async function validateAdminSession(): Promise<boolean> {
  if (!isAuthenticated()) {
    clearSession();
    return false;
  }
  try {
    await adminApi.me();
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
    }
    return false;
  }
}

const TOKEN_KEY = "avip.admin.token";
const USERNAME_KEY = "avip.admin.username";
const EXPIRES_KEY = "avip.admin.expiresAt";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function getExpiresAt(): string | null {
  return localStorage.getItem(EXPIRES_KEY);
}

export function setSession(token: string, username: string, expiresAt: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(EXPIRES_KEY, expiresAt);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/** Client-side gate: token present and not past expiresAt (RFC3339 from API). */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }
  const expiresAt = getExpiresAt();
  if (!expiresAt) {
    return true;
  }
  const expiryMs = Date.parse(expiresAt);
  if (Number.isNaN(expiryMs)) {
    return true;
  }
  return expiryMs > Date.now();
}

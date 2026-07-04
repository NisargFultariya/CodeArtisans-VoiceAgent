export class PortalApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text || response.statusText;
  } catch {
    return response.statusText;
  }
}

async function portalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new PortalApiError(response.status, await parseError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export type PortalLoginResponse = {
  message: string;
  email: string;
};

export type PortalMeResponse = {
  email: string;
  fullName: string | null;
  accountId: string;
  accountName: string;
  role: string;
};

export type PortalShopItem = {
  id: string;
  shopDomain: string;
};

export async function grantPortalAccess(token: string): Promise<void> {
  const response = await fetch(`/portal/grant-access?access=${encodeURIComponent(token)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new PortalApiError(response.status, await parseError(response));
  }
}

export const portalApi = {
  requestLogin(email: string, fullName?: string, accountName?: string) {
    return portalFetch<PortalLoginResponse>("/portal/api/auth/request-login", {
      method: "POST",
      body: JSON.stringify({ email, fullName, accountName }),
    });
  },
  me() {
    return portalFetch<PortalMeResponse>("/portal/api/auth/me");
  },
  shops() {
    return portalFetch<{ shops: PortalShopItem[] }>("/portal/api/shops");
  },
  logout() {
    return portalFetch<void>("/portal/api/auth/logout", { method: "POST" });
  },
};

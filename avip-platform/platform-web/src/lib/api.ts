import { clearSession, getToken } from "./auth";

export class ApiError extends Error {
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

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...init, headers });
  if (response.status === 401) {
    clearSession();
  }
  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export type AdminLoginResponse = {
  token: string;
  expiresAt: string;
  username: string;
};

export type AdminDashboardResponse = {
  totalShops: number;
  totalCalls: number;
  callsThisMonth: number;
  completedCalls: number;
  recoveryRate: string;
  avgDurationSeconds: number;
  openEscalations: number;
  recentCalls: AdminCallItem[];
  recentEscalations: AdminEscalationItem[];
};

export type AdminShopItem = {
  id: string;
  shopDomain: string;
  installedAt: string | null;
  callCount: number;
};

export type AdminCallItem = {
  shopId: string;
  shopDomain: string;
  orderId: string;
  status: string;
  outcome: string | null;
  workflowId: string | null;
  durationSeconds: number | null;
  updatedAt: string;
};

export type AdminEscalationItem = {
  id: string;
  shopId: string;
  shopDomain: string;
  orderId: string;
  reason: string | null;
  status: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDemoRequestItem = {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  shopDomain: string | null;
  monthlyVolume: string | null;
  message: string | null;
  source: string;
  status: string;
  demoShopId: string | null;
  createdAt: string;
};

export const adminApi = {
  login(username: string, password: string) {
    return apiFetch<AdminLoginResponse>("/admin/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  me() {
    return apiFetch<{ username: string }>("/admin/api/auth/me");
  },
  dashboard() {
    return apiFetch<AdminDashboardResponse>("/admin/api/dashboard");
  },
  shops(limit = 100) {
    return apiFetch<{ shops: AdminShopItem[] }>(`/admin/api/shops?limit=${limit}`);
  },
  calls(limit = 50) {
    return apiFetch<{ calls: AdminCallItem[] }>(`/admin/api/calls?limit=${limit}`);
  },
  escalations(limit = 50) {
    return apiFetch<{ escalations: AdminEscalationItem[] }>(
      `/admin/api/escalations?limit=${limit}`,
    );
  },
  demoRequests(limit = 50) {
    return apiFetch<{ requests: AdminDemoRequestItem[]; newCount: number }>(
      `/admin/api/demo-requests?limit=${limit}`,
    );
  },
  sendDemoInvite(email: string) {
    return apiFetch<{ message: string; email: string }>("/admin/api/demo-invites", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};

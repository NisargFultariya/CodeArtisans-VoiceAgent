import { ApiError } from "./api";

function parseMarketingError(status: number, text: string): string {
  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body.error === "string" && body.error.trim() && status !== 404) {
      return body.error;
    }
  } catch {
    // fall through
  }
  if (status === 404) {
    return "Demo service not found. Restart the platform API (run task up in platform/) and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  return text.trim() || "Something went wrong. Please try again.";
}

async function throwMarketingError(response: Response): Promise<never> {
  let text = response.statusText;
  try {
    text = (await response.text()) || text;
  } catch {
    // ignore
  }
  throw new ApiError(response.status, parseMarketingError(response.status, text));
}

export type DemoAccessResponse = {
  message: string;
};

export type CreateDemoRequestResponse = {
  requestId: string;
  demoShopDomain: string | null;
  message: string;
};

export type CreateDemoRequestBody = {
  email: string;
  source?: "book-demo" | "contact";
  fullName?: string;
  company?: string;
  shopDomain?: string;
  monthlyVolume?: string;
  message?: string;
};

export async function requestDemoAccess(email: string): Promise<DemoAccessResponse> {
  const response = await fetch("/api/marketing/demo-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    await throwMarketingError(response);
  }

  return (await response.json()) as DemoAccessResponse;
}

export async function submitDemoRequest(body: CreateDemoRequestBody): Promise<CreateDemoRequestResponse> {
  const response = await fetch("/api/marketing/demo-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwMarketingError(response);
  }

  return (await response.json()) as CreateDemoRequestResponse;
}

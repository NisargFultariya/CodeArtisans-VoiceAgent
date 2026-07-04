export async function parseDemoErrorResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return response.statusText || "Request failed";
    try {
      const body = JSON.parse(text) as { message?: string; error?: string };
      if (body.message) return body.message;
      if (body.error && response.status !== 500) return body.error;
    } catch {
      // plain text from Spring
    }
    if (response.status === 412) {
      return "LiveKit is not configured on the server. Add LIVEKIT_* keys to platform/.env and restart.";
    }
    if (response.status === 401 || response.status === 403) {
      return "Demo access expired — request a new link.";
    }
    if (response.status >= 500) {
      return "Server error starting the demo. Check platform-api logs.";
    }
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return response.statusText || "Request failed";
  }
}

export type DemoAccessStatus = {
  granted: boolean;
};

export async function grantDemoAccess(token: string): Promise<void> {
  const response = await fetch(`/demo/grant-access?access=${encodeURIComponent(token)}`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error("This demo link is invalid or has expired.");
  }
}

export async function checkDemoAccess(): Promise<boolean> {
  try {
    const response = await fetch("/demo/access-status", { credentials: "same-origin" });
    if (!response.ok) return false;
    const data = (await response.json()) as DemoAccessStatus;
    return data.granted;
  } catch {
    return false;
  }
}

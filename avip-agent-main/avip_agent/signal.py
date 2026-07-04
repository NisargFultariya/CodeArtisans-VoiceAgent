from __future__ import annotations

import httpx


async def call_completed(
    *,
    api_url: str,
    secret: str,
    workflow_id: str,
    outcome: str,
    reason: str,
    language: str,
    call_duration_seconds: int,
    user_utterances: list[str],
    agent_id: str,
    status: str = "completed",
) -> None:
    url = f"{api_url.rstrip('/')}/internal/signals/call-completed"
    payload = {
        "workflowId": workflow_id,
        "payload": {
            "outcome": outcome,
            "reason": reason,
            "language": language,
            "callDurationSeconds": call_duration_seconds,
            "userUtterances": user_utterances,
            "agentId": agent_id,
            "status": status,
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={
                "Content-Type": "application/json",
                "x-avip-internal-secret": secret,
            },
            json=payload,
        )
        if response.status_code < 200 or response.status_code >= 300:
            raise RuntimeError(f"signal call-completed: HTTP {response.status_code}")

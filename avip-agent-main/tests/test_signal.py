from __future__ import annotations

import httpx
import pytest
import respx

from avip_agent.signal import call_completed


@pytest.mark.unit
@pytest.mark.asyncio
@respx.mock
async def test_call_completed_posts_expected_payload() -> None:
    route = respx.post("http://localhost:3000/internal/signals/call-completed").mock(
        return_value=httpx.Response(200)
    )
    await call_completed(
        api_url="http://localhost:3000",
        secret="test-secret",
        workflow_id="wf-42",
        outcome="completed",
        reason="not home",
        language="hi-IN",
        call_duration_seconds=90,
        user_utterances=["hello", "not home"],
        agent_id="job-1",
    )
    assert route.called
    request = route.calls[0].request
    assert request.headers["x-avip-internal-secret"] == "test-secret"
    import json

    body = json.loads(request.content)
    assert body["workflowId"] == "wf-42"
    assert body["payload"]["reason"] == "not home"
    assert body["payload"]["userUtterances"] == ["hello", "not home"]
    assert body["payload"]["callDurationSeconds"] == 90


@pytest.mark.unit
@pytest.mark.asyncio
@respx.mock
async def test_call_completed_raises_on_http_error() -> None:
    respx.post("http://localhost:3000/internal/signals/call-completed").mock(
        return_value=httpx.Response(401)
    )
    with pytest.raises(RuntimeError, match="HTTP 401"):
        await call_completed(
            api_url="http://localhost:3000",
            secret="bad",
            workflow_id="wf",
            outcome="completed",
            reason="x",
            language="hi-IN",
            call_duration_seconds=1,
            user_utterances=[],
            agent_id="j",
        )

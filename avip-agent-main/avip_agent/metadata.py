from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass
class JobMetadata:
    workflow_id: str = ""
    shop_id: str = ""
    order_id: str = ""
    system_prompt: str = ""
    simulation_mode: bool = False
    customer_name: str = ""
    order_name: str = ""
    language: str = "hi-IN"
    objective: str = ""
    scenario: str = ""
    agent_name: str = ""
    custom_data: dict[str, Any] = None


    @property
    def is_demo(self) -> bool:
        return self.workflow_id == "" and (
            self.simulation_mode or self.shop_id == "" or self.order_id == ""
        )

    @property
    def is_simulation(self) -> bool:
        """Merchant simulate-rto: Temporal workflow + scripted dialogue, no PSTN dial."""
        return self.simulation_mode and bool(self.workflow_id.strip())


def _str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def _bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in {"true", "1", "yes"}
    return False


def parse_job_metadata(raw: str, default_language: str = "hi-IN") -> JobMetadata:
    meta = JobMetadata(language=default_language or "hi-IN")
    raw = raw.strip()
    if not raw:
        return meta
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return meta
    if not isinstance(payload, dict):
        return meta
    meta.workflow_id = _str(payload.get("workflowId"))
    meta.shop_id = _str(payload.get("shopId"))
    meta.order_id = _str(payload.get("orderId"))
    meta.system_prompt = _str(payload.get("systemPrompt"))
    meta.simulation_mode = _bool(payload.get("simulationMode"))
    meta.customer_name = _str(payload.get("customerName"))
    meta.order_name = _str(payload.get("orderName"))
    if lang := _str(payload.get("language")):
        meta.language = lang
    meta.objective = _str(payload.get("objective"))
    meta.scenario = _str(payload.get("scenario"))
    meta.agent_name = _str(payload.get("agentName")) or "Meera"
    meta.custom_data = payload.get("customData") or {}
    return meta


def is_demo_room(room_name: str) -> bool:
    return room_name.startswith("avip-demo-")

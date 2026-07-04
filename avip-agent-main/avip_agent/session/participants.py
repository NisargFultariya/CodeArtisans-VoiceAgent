from __future__ import annotations

from livekit import rtc


def remote_participants(room: rtc.Room) -> list[rtc.RemoteParticipant]:
    return [
        participant
        for participant in room.remote_participants.values()
        if not participant.identity.startswith("agent-")
        and participant.identity != "avip-agent"
    ]

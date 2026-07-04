from __future__ import annotations

import pytest

from avip_agent.trai import with_trai_disclosure


@pytest.mark.unit
def test_trai_prefix_hindi() -> None:
    out = with_trai_disclosure("नमस्ते", "hi-IN")
    assert out.startswith("यह एक AI")
    assert out.endswith("नमस्ते")


@pytest.mark.unit
def test_trai_idempotent() -> None:
    once = with_trai_disclosure("hello", "hi-IN")
    twice = with_trai_disclosure(once, "hi-IN")
    assert once == twice


@pytest.mark.unit
def test_trai_empty_unchanged() -> None:
    assert with_trai_disclosure("  ", "hi-IN") == ""

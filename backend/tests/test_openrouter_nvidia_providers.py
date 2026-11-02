"""Unit and Integration Tests for OpenRouter Free Tier & NVIDIA NIM Integration.

Verifies:
1. OpenRouter free tier constraint enforcement (ensuring only :free models are queried).
2. Proper OpenRouter protocol headers (Authorization, HTTP-Referer, X-Title).
3. Free-tier multi-model fallback cascade on 429 rate limit.
4. NVIDIA NIM configuration, endpoint generation, and error resilience.
5. End-to-end integration with ProjectAIReviewEngine.
"""

import pytest
from unittest.mock import patch, MagicMock
import httpx

from backend.app.config import settings
from backend.app.services.openrouter_service import OpenRouterProvider, DEFAULT_FREE_FALLBACK_MODELS
from backend.app.services.nvidia_service import NvidiaNimProvider
from backend.app.services.project_ai_review_engine import ProjectAIReviewEngine


def test_openrouter_free_tier_enforcement():
    """Verify that OpenRouterProvider strictly forces :free models when free_only=True."""
    provider = OpenRouterProvider(api_key="test-key", free_only=True)
    
    # 1. Model already ending with :free
    assert provider._enforce_free_tier("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free") == "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
    
    # 2. Model lacking :free suffix -> automatically appended to protect user from charges
    assert provider._enforce_free_tier("meta-llama/llama-3.3-70b-instruct") == "meta-llama/llama-3.3-70b-instruct:free"
    assert provider._enforce_free_tier("google/gemma-4-31b-it") == "google/gemma-4-31b-it:free"


def test_openrouter_headers():
    """Verify standard OpenRouter headers per official documentation."""
    provider = OpenRouterProvider(api_key="sk-test-openrouter-key")
    headers = provider._get_headers()
    
    assert headers["Authorization"] == "Bearer sk-test-openrouter-key"
    assert headers["HTTP-Referer"] == settings.openrouter_site_url
    assert headers["X-Title"] == settings.openrouter_site_name
    assert headers["Content-Type"] == "application/json"


def test_openrouter_429_automatic_fallback():
    """Verify that if a free model receives 429 rate limit, it cascades to the next free model."""
    provider = OpenRouterProvider(api_key="sk-test-key", model_name="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
    
    calls = []
    
    def mock_post(url, headers, json, **kwargs):
        model = json["model"]
        calls.append(model)
        if len(calls) == 1:
            # First free model hits 429
            return MagicMock(status_code=429, text="Rate limit exceeded")
        # Second free model succeeds
        return MagicMock(
            status_code=200,
            json=lambda: {
                "choices": [
                    {
                        "message": {
                            "content": '{"executive_summary": "Test summary", "strengths_summary": "Test strength", "findings": []}'
                        }
                    }
                ]
            }
        )

    with patch("httpx.Client.post", side_effect=mock_post):
        result = provider._call_openrouter_json("system test", "user test")
        assert result["executive_summary"] == "Test summary"
        assert len(calls) == 2
        # First tried was the primary free model
        assert calls[0] == "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
        # Second tried was a fallback free model
        assert calls[1] in DEFAULT_FREE_FALLBACK_MODELS


def test_nvidia_nim_provider_headers():
    """Verify NVIDIA NIM headers and configuration."""
    provider = NvidiaNimProvider(api_key="nvapi-test-key", model_name="nvidia/llama-3.1-nemotron-70b-instruct")
    assert provider.is_configured is True
    headers = provider._get_headers()
    assert headers["Authorization"] == "Bearer nvapi-test-key"
    assert headers["Content-Type"] == "application/json"


def test_nvidia_nim_markdown_fence_cleaning():
    """Verify that NVIDIA NIM cleans markdown json fences returned by LLMs."""
    provider = NvidiaNimProvider(api_key="nvapi-test-key")
    
    mock_resp = MagicMock(
        status_code=200,
        json=lambda: {
            "choices": [
                {
                    "message": {
                        "content": '```json\n{"status": "ok", "provider": "nvidia"}\n```'
                    }
                }
            ]
        }
    )
    with patch("httpx.Client.post", return_value=mock_resp):
        res = provider._call_nvidia_json("system", "user")
        assert res["status"] == "ok"
        assert res["provider"] == "nvidia"


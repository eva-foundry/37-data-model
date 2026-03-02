#!/usr/bin/env python3
# EVA-STORY: F37-TRACE-002
# lm_tracer.py -- Unified LLM interaction logging and cost tracking
# 
# Captures all LLM calls with: timestamp, model, tokens, cost, latency, prompt hash, response hash
# Stores to .eva/traces/ for audit trail and cost analysis
#
# Usage:
#   tracer = LMTracer(story_id="BUG-F37-001", phase="A", correlation_id="SPRINT-0.5-...")
#   response = tracer.call_lm(model="gpt-4o-mini", system_prompt="...", user_prompt="...")
#   tracer.save()  # Writes .eva/traces/BUG-F37-001-A-lm-calls.json

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List

try:
    import requests
except ImportError:
    requests = None


# LLM Model Configuration & Pricing (matches GitHub Models)
LLM_MODELS = {
    "gpt-4o-mini": {
        "provider": "OpenAI",
        "tier": "free",
        "url": "https://models.inference.ai.azure.com",
        "input_multiplier": 0.015,
        "output_multiplier": 0.0075,
        "max_tokens_in": 8000,
        "max_tokens_out": 4000,
        "use_for": ["95% of bugs: Phase A (RCA), Phase B (fix), Phase C (test)"]
    },
    "gpt-4o": {
        "provider": "OpenAI",
        "tier": "free-limited",
        "url": "https://models.inference.ai.azure.com",
        "input_multiplier": 0.25,
        "output_multiplier": 0.125,
        "max_tokens_in": 8000,
        "max_tokens_out": 4000,
        "use_for": ["Critical bugs, RCA expert role, complex refactoring"]
    },
    "claude-3-5-haiku": {
        "provider": "Anthropic",
        "tier": "foundry-paid",
        "url": "https://api.anthropic.com",
        "input_multiplier": 0.08,
        "output_multiplier": 0.04,
        "max_tokens_in": 200000,
        "max_tokens_out": 4096,
        "use_for": ["If user brings Foundry model (BYOK)", "Deep reasoning tasks"],
        "note": "Not in GitHub Models free tier - requires Foundry"
    },
    "claude-3-5-sonnet": {
        "provider": "Anthropic",
        "tier": "foundry-paid",
        "url": "https://api.anthropic.com",
        "input_multiplier": 0.15,
        "output_multiplier": 0.08,
        "max_tokens_in": 200000,
        "max_tokens_out": 4096,
        "use_for": ["Complex analysis", "Scrum Master decisions"],
        "note": "Not in GitHub Models free tier - requires Foundry"
    }
}

TOKEN_UNIT_PRICE = 0.00001  # USD per token unit (GitHub Models pricing)


class LMCall:
    """Single LLM API call with full tracing."""
    
    def __init__(self, model: str, system_prompt: str, user_prompt: str):
        self.model = model
        self.system_prompt = system_prompt
        self.user_prompt = user_prompt
        
        self.timestamp_start = datetime.now(timezone.utc)
        self.timestamp_end: Optional[datetime] = None
        
        self.tokens_in = 0
        self.tokens_out = 0
        self.response_text = ""
        self.error: Optional[str] = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Export as JSON-serializable dict."""
        cost_usd = self._calculate_cost()
        latency_ms = self._calculate_latency()
        
        return {
            "model": self.model,
            "timestamp_start": self.timestamp_start.isoformat(),
            "timestamp_end": self.timestamp_end.isoformat() if self.timestamp_end else None,
            "latency_ms": latency_ms,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "cost_usd": round(cost_usd, 8),
            "prompt_hash": hashlib.sha256(self.system_prompt.encode()).hexdigest()[:16],
            "response_hash": hashlib.sha256(self.response_text.encode()).hexdigest()[:16],
            "error": self.error
        }
    
    def _calculate_cost(self) -> float:
        """Calculate cost in USD based on model multipliers."""
        if self.model not in LLM_MODELS:
            return 0.0
        
        config = LLM_MODELS[self.model]
        input_units = self.tokens_in * config["input_multiplier"]
        output_units = self.tokens_out * config["output_multiplier"]
        total_units = input_units + output_units
        return total_units * TOKEN_UNIT_PRICE
    
    def _calculate_latency(self) -> int:
        """Calculate latency in milliseconds."""
        if not self.timestamp_end:
            return 0
        delta = self.timestamp_end - self.timestamp_start
        return int(delta.total_seconds() * 1000)


class LMTracer:
    """Unified LLM tracing across a story/phase."""
    
    def __init__(self, story_id: str, phase: str, correlation_id: str, 
                 repo_root: Optional[str] = None):
        self.story_id = story_id
        self.phase = phase
        self.correlation_id = correlation_id
        self.repo_root = Path(repo_root) if repo_root else Path.cwd()
        
        self.lm_calls: List[LMCall] = []
        self.created_at = datetime.now(timezone.utc)
        
    def call_lm(self, model: str, system_prompt: str, user_prompt: str,
                response_text: str = "", tokens_in: int = 0, 
                tokens_out: int = 0, error: Optional[str] = None) -> LMCall:
        """
        Record an LM call.
        
        In real usage, this would call the actual LM API here and capture response.
        For now, this accepts response data from the caller (OpenAI SDK already called).
        """
        call = LMCall(model, system_prompt, user_prompt)
        call.timestamp_end = datetime.now(timezone.utc)
        call.response_text = response_text
        call.tokens_in = tokens_in
        call.tokens_out = tokens_out
        call.error = error
        
        self.lm_calls.append(call)
        return call
    
    def save(self) -> Path:
        """Write trace to .eva/traces/{story_id}-{phase}-lm-calls.json"""
        eva_dir = self.repo_root / ".eva" / "traces"
        eva_dir.mkdir(parents=True, exist_ok=True)
        
        trace_file = eva_dir / f"{self.story_id}-{self.phase}-lm-calls.json"
        
        data = {
            "correlation_id": self.correlation_id,
            "story_id": self.story_id,
            "phase": self.phase,
            "created_at": self.created_at.isoformat(),
            "lm_calls": [call.to_dict() for call in self.lm_calls],
            "summary": {
                "total_calls": len(self.lm_calls),
                "total_tokens_in": sum(c.tokens_in for c in self.lm_calls),
                "total_tokens_out": sum(c.tokens_out for c in self.lm_calls),
                "total_cost_usd": round(sum(c._calculate_cost() for c in self.lm_calls), 8),
                "total_latency_ms": sum(c._calculate_latency() for c in self.lm_calls),
            }
        }
        
        trace_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"[INFO] Trace written: {trace_file}")
        return trace_file
    
    def get_summary(self) -> Dict[str, Any]:
        """Get aggregated metrics."""
        return {
            "total_calls": len(self.lm_calls),
            "total_tokens_in": sum(c.tokens_in for c in self.lm_calls),
            "total_tokens_out": sum(c.tokens_out for c in self.lm_calls),
            "total_cost_usd": round(sum(c._calculate_cost() for c in self.lm_calls), 8),
            "total_latency_ms": sum(c._calculate_latency() for c in self.lm_calls),
        }


def generate_correlation_id(sprint_id: str) -> str:
    """Generate unique correlation ID for entire sprint."""
    import uuid
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    unique = str(uuid.uuid4())[:8]
    return f"{sprint_id}-{timestamp}-{unique}"


def get_model_for_severity(severity: str, default: str = "gpt-4o-mini") -> str:
    """
    Route to appropriate model based on story severity.
    
    Free tier (95% of cases): gpt-4o-mini
    Critical/Expert: gpt-4o (if budgeted)
    """
    if severity in ["CRITICAL", "BLOCKER"]:
        return "gpt-4o"  # Higher quality for critical bugs
    return default


if __name__ == "__main__":
    # Example usage
    tracer = LMTracer("BUG-F37-001", "A", "SPRINT-0.5-20260301-a1b2c3d4")
    
    # Simulate an LM call
    tracer.call_lm(
        model="gpt-4o-mini",
        system_prompt="You are a root cause analysis expert...",
        user_prompt="Why isn't row_version incremented in custom routers?",
        response_text="The custom routers in api/routers/ follow different patterns...",
        tokens_in=245,
        tokens_out=89
    )
    
    tracer.save()
    print(json.dumps(tracer.get_summary(), indent=2))

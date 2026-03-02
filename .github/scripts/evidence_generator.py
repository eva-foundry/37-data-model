"""
EVA Evidence Generator Library

Generic evidence builder for DPDCA phase completion across all projects.
Import and use this library from any project without modification.

Example:
    from pathlib import Path
    import sys
    foundry_path = Path(__file__).parent.parent.parent / "37-data-model"
    sys.path.insert(0, str(foundry_path))
    from tools.evidence import EvidenceBuilder

    gen = EvidenceBuilder(
        sprint_id="ACA-S11",
        story_id="ACA-14-001",
        story_title="Rule loader for 51-ACA",
        phase="A",
    )
    gen.add_validation(test_result="PASS", lint_result="PASS", coverage_percent=85)
    gen.add_metrics(duration_ms=7850, files_changed=2, lines_added=156)
    gen.add_artifact(path="services/analysis/app/main.py", type="source", action="modified")
    gen.add_commit(sha="07ff958c", message="feat(ACA-14): rule loader")
    gen.validate()
    receipt = gen.build()
    # POST to data model: PUT /model/evidence/{receipt.id} -Body (receipt | ConvertTo-Json)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4


class EvidenceBuilder:
    """Generic evidence receipt builder for DPDCA phases."""

    def __init__(
        self,
        sprint_id: str,
        story_id: str,
        phase: str,
        story_title: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        """
        Initialize evidence builder.

        Args:
            sprint_id: Reference to sprints.id (e.g. 'ACA-S11')
            story_id: Story ID being completed (e.g. 'ACA-14-001')
            phase: DPDCA phase: D1, D2, P, D3, A
            story_title: Optional story title for readability
            correlation_id: Optional correlation ID for tying operations together
        """
        if phase not in ("D1", "D2", "P", "D3", "A"):
            raise ValueError(f"Invalid phase '{phase}'. Must be one of: D1, D2, P, D3, A")

        self.sprint_id = sprint_id
        self.story_id = story_id
        self.phase = phase
        self.story_title = story_title
        self.correlation_id = correlation_id
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.completed_at: Optional[str] = None
        self.summary: Optional[str] = None
        self.artifacts: list[dict[str, str]] = []
        self.validation: dict[str, Any] = {}
        self.metrics: dict[str, Any] = {}
        self.commits: list[dict[str, str]] = []
        self.context: dict[str, Any] = {}

    def add_summary(self, summary: str) -> EvidenceBuilder:
        """Add human-readable summary of what was accomplished."""
        self.summary = summary
        return self

    def add_artifact(
        self,
        path: str,
        type_: str,
        action: str,
    ) -> EvidenceBuilder:
        """
        Add an artifact (file) produced or modified in this phase.

        Args:
            path: File or resource path
            type_: One of: source, test, schema, config, doc, report, other
            action: One of: created, modified, deleted
        """
        if type_ not in ("source", "test", "schema", "config", "doc", "report", "other"):
            raise ValueError(f"Invalid artifact type '{type_}'")
        if action not in ("created", "modified", "deleted"):
            raise ValueError(f"Invalid artifact action '{action}'")

        self.artifacts.append({
            "path": path,
            "type": type_,
            "action": action,
        })
        return self

    def add_validation(
        self,
        test_result: Optional[str] = None,
        lint_result: Optional[str] = None,
        coverage_percent: Optional[int] = None,
        audit_result: Optional[str] = None,
        messages: Optional[list[str]] = None,
    ) -> EvidenceBuilder:
        """
        Add validation gate results.

        Args:
            test_result: One of PASS, FAIL, WARN, SKIP
            lint_result: One of PASS, FAIL, WARN, SKIP
            coverage_percent: Code coverage percentage (0-100)
            audit_result: One of PASS, FAIL, WARN, SKIP
            messages: Detailed validation messages
        """
        for result in [test_result, lint_result, audit_result]:
            if result and result not in ("PASS", "FAIL", "WARN", "SKIP"):
                raise ValueError(f"Invalid result '{result}'. Must be PASS, FAIL, WARN, or SKIP")

        if coverage_percent is not None:
            if not (0 <= coverage_percent <= 100):
                raise ValueError("coverage_percent must be between 0 and 100")

        if test_result:
            self.validation["test_result"] = test_result
        if lint_result:
            self.validation["lint_result"] = lint_result
        if coverage_percent is not None:
            self.validation["coverage_percent"] = coverage_percent
        if audit_result:
            self.validation["audit_result"] = audit_result
        if messages:
            self.validation["messages"] = messages

        return self

    def add_metrics(
        self,
        duration_ms: Optional[int] = None,
        files_changed: Optional[int] = None,
        lines_added: Optional[int] = None,
        lines_deleted: Optional[int] = None,
        tokens_used: Optional[int] = None,
        cost_usd: Optional[float] = None,
        test_count: Optional[int] = None,
    ) -> EvidenceBuilder:
        """
        Add performance and cost metrics.

        Args:
            duration_ms: How long the phase took (milliseconds)
            files_changed: Number of files added/modified/deleted
            lines_added: Lines of code added
            lines_deleted: Lines of code deleted
            tokens_used: LM tokens used in this phase
            cost_usd: Cost in USD if LM calls made
            test_count: Total test count after phase
        """
        if duration_ms is not None and duration_ms < 0:
            raise ValueError("duration_ms must be non-negative")

        if duration_ms is not None:
            self.metrics["duration_ms"] = duration_ms
        if files_changed is not None:
            self.metrics["files_changed"] = files_changed
        if lines_added is not None:
            self.metrics["lines_added"] = lines_added
        if lines_deleted is not None:
            self.metrics["lines_deleted"] = lines_deleted
        if tokens_used is not None:
            self.metrics["tokens_used"] = tokens_used
        if cost_usd is not None:
            self.metrics["cost_usd"] = cost_usd
        if test_count is not None:
            self.metrics["test_count"] = test_count

        return self

    def add_commit(
        self,
        sha: str,
        message: str,
        timestamp: Optional[str] = None,
    ) -> EvidenceBuilder:
        """
        Add a git commit created in this phase.

        Args:
            sha: Commit SHA (7+ hex chars)
            message: Commit message
            timestamp: When committed (RFC3339 format, defaults to now)
        """
        if len(sha) < 7:
            raise ValueError("Commit SHA must be at least 7 characters")

        self.commits.append({
            "sha": sha,
            "message": message,
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        })
        return self

    def add_context(self, key: str, value: Any) -> EvidenceBuilder:
        """Add custom context or metadata specific to this story/phase."""
        self.context[key] = value
        return self

    def set_completed_at(self, completed_at: str) -> EvidenceBuilder:
        """
        Set when the phase actually completed (RFC3339 format).
        If not set, defaults to created_at.
        """
        self.completed_at = completed_at
        return self

    def validate(self) -> bool:
        """
        Validate evidence against schema constraints.

        Returns:
            True if valid, raises ValueError if invalid.
        """
        # Required fields
        if not self.sprint_id:
            raise ValueError("sprint_id is required")
        if not self.story_id:
            raise ValueError("story_id is required")
        if not self.phase:
            raise ValueError("phase is required")
        if not self.created_at:
            raise ValueError("created_at is required")

        # Validation result constraints (merge blockers)
        test_result = self.validation.get("test_result")
        if test_result == "FAIL":
            raise ValueError("test_result=FAIL will block merge. Fix tests before evidence submission.")

        lint_result = self.validation.get("lint_result")
        if lint_result == "FAIL":
            raise ValueError("lint_result=FAIL will block merge. Fix linting before evidence submission.")

        # Coverage warning (not a blocker but informational)
        coverage = self.validation.get("coverage_percent")
        if coverage is not None and coverage < 80:
            import warnings
            warnings.warn(f"Code coverage {coverage}% is below 80% target")

        return True

    def build(self) -> dict[str, Any]:
        """
        Build and return the evidence receipt as a dictionary.

        Raises:
            ValueError: If evidence is invalid.
        """
        self.validate()

        evidence_id = f"{self.sprint_id}-{self.story_id}-{self.phase}"

        receipt: dict[str, Any] = {
            "id": evidence_id,
            "sprint_id": self.sprint_id,
            "story_id": self.story_id,
            "phase": self.phase,
            "created_at": self.created_at,
        }

        if self.correlation_id:
            receipt["correlation_id"] = self.correlation_id
        if self.story_title:
            receipt["story_title"] = self.story_title
        if self.completed_at:
            receipt["completed_at"] = self.completed_at
        if self.summary:
            receipt["summary"] = self.summary
        if self.artifacts:
            receipt["artifacts"] = self.artifacts
        if self.validation:
            receipt["validation"] = self.validation
        if self.metrics:
            receipt["metrics"] = self.metrics
        if self.commits:
            receipt["commits"] = self.commits
        if self.context:
            receipt["context"] = self.context

        return receipt

    @staticmethod
    def from_dict(data: dict[str, Any]) -> EvidenceBuilder:
        """
        Reconstruct evidence builder from a dictionary (e.g., loaded from JSON).
        Useful for loading existing evidence and modifying it.
        """
        gen = EvidenceBuilder(
            sprint_id=data.get("sprint_id"),
            story_id=data.get("story_id"),
            phase=data.get("phase"),
            story_title=data.get("story_title"),
            correlation_id=data.get("correlation_id"),
        )
        gen.created_at = data.get("created_at", gen.created_at)
        gen.completed_at = data.get("completed_at")
        gen.summary = data.get("summary")
        gen.artifacts = data.get("artifacts", [])
        gen.validation = data.get("validation", {})
        gen.metrics = data.get("metrics", {})
        gen.commits = data.get("commits", [])
        gen.context = data.get("context", {})
        return gen

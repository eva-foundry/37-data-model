"""
# EVA-STORY: F37-DPDCA-001
gen-sprint-manifest.py -- generate a sprint manifest stub from Veritas story IDs
==================================================================================
Reads veritas-plan.json and PLAN.md to build a .github/sprints/sprint-NN-name.md
stub.  Story IDs are taken verbatim from veritas-plan.json -- never invented.

Usage:
  python scripts/gen-sprint-manifest.py --stories F37-FK-101,F37-FK-102,F37-FK-103
  python scripts/gen-sprint-manifest.py --sprint 01 --stories F37-FK-101,F37-FK-102
  python scripts/gen-sprint-manifest.py --sprint 00 --name "phase0-validation" --stories F37-FK-001,F37-FK-002,F37-FK-003 --sizes F37-FK-001=M,F37-FK-002=XS,F37-FK-003=M
  python scripts/gen-sprint-manifest.py --list-done         # list done stories
  python scripts/gen-sprint-manifest.py --list-undone       # list undone stories (default filter)

The output file is a markdown doc containing a SPRINT_MANIFEST JSON block that the
sprint-agent.yml workflow parses.  Fill in the TODOs before creating the GitHub issue.

Encoding: ascii-only output -- no emoji, no unicode.

Revisions:
    2026-03-10: Refactored to use eva_script_infra (Session 44 compliance)
"""

import re
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone

# Professional Coding Standards infrastructure
from eva_script_infra import (
    setup_logging, save_evidence, save_error_evidence, ensure_directories,
    timestamped_filename, check_file_exists,
    STATUS_PASS, STATUS_FAIL, STATUS_INFO, STATUS_ERROR,
    format_status
)

REPO_ROOT    = Path(__file__).parent.parent
PLAN_FILE    = REPO_ROOT / "PLAN.md"
VERITAS_FILE = REPO_ROOT / ".eva" / "veritas-plan.json"
SPRINTS_DIR  = REPO_ROOT / ".github" / "sprints"

# Module-level logger
logger = None

# Default model per story size -- must be a model available via GITHUB_TOKEN
# at https://models.inference.ai.azure.com (verified 2026-02-27):
#   gpt-4o, gpt-4o-mini, Meta-Llama-3.1-405B-Instruct, Mistral-large-2407
# Claude models are NOT available via GITHUB_TOKEN in CI -- removed from table
MODEL_BY_SIZE = {
    "XS": "gpt-4o-mini",
    "S":  "gpt-4o-mini",
    "M":  "gpt-4o",
    "L":  "gpt-4o",
    "XL": "gpt-4o",
}

EPIC_LABEL = {
    "F37-01": "Epic 01 -- Foundation",
    "F37-02": "Epic 02 -- Data/API",
    "F37-FK": "Epic FK -- FK Enhancement",
}


def load_veritas() -> dict:
    if not VERITAS_FILE.exists():
        logger.error(format_status(STATUS_FAIL, f"veritas-plan.json not found: {VERITAS_FILE}"))
        logger.info(format_status(STATUS_INFO, "Run: python scripts/seed-from-plan.py"))
        sys.exit(2)
    return json.loads(VERITAS_FILE.read_text(encoding="utf-8"))


def build_story_index(veritas: dict) -> dict[str, dict]:
    """Return dict: canonical_id -> story object (with wbs, title, feature_id, done)."""
    index: dict[str, dict] = {}
    for feat in veritas.get("features", []):
        for story in feat.get("stories", []):
            sid = story.get("id", "")
            if sid:
                index[sid] = story
    return index


def list_stories(veritas: dict, show_done: bool = False) -> None:
    index = build_story_index(veritas)
    header = "DONE stories:" if show_done else "Undone stories (ready for sprint):"
    logger.info(header)
    logger.info("-" * 60)
    for sid, story in sorted(index.items()):
        if story.get("done", False) == show_done:
            wbs = story.get("wbs", "")
            wbs_str = f" [wbs:{wbs}]" if wbs else ""
            logger.info(f"  {sid}{wbs_str}  {story.get('title', '')[:70]}")
    print()


def make_story_stub(story: dict, size: str = "M") -> dict:
    """Build a single story entry for the SPRINT_MANIFEST."""
    sid = story.get("id", "UNKNOWN")
    epic_prefix = "-".join(sid.split("-")[:2])  # "F37-FK"
    wbs = story.get("wbs", "")
    model = MODEL_BY_SIZE.get(size.upper(), "gpt-4o")
    epic_label = EPIC_LABEL.get(epic_prefix, f"Epic {epic_prefix}")

    return {
        "id": sid,
        "title": story.get("title", ""),
        "wbs": wbs,
        "size": size.upper(),
        "model": model,
        "model_rationale": "TODO: describe why this model was chosen",
        "epic": epic_label,
        "files_to_create": [
            "TODO: list files to create or update"
        ],
        "acceptance": [
            "TODO: add acceptance criteria"
        ],
        "implementation_notes": "TODO: add detailed implementation notes for the agent",
    }


def generate_manifest(
    sprint_num: str,
    sprint_name: str,
    story_ids: list[str],
    story_index: dict[str, dict],
    sizes: dict[str, str],
) -> str:
    """Generate the sprint manifest markdown string."""
    stories = []
    missing = []
    for sid in story_ids:
        if sid not in story_index:
            missing.append(sid)
            print(f"[WARN] Story ID not found in veritas-plan.json: {sid}")
            print("[INFO] Run: python scripts/seed-from-plan.py")
            print("[INFO] Then: python scripts/reflect-ids.py")
        else:
            size = sizes.get(sid, "M")
            stories.append(make_story_stub(story_index[sid], size))

    if missing:
        print(f"[FAIL] {len(missing)} story IDs not found. Aborting.")
        sys.exit(1)

    # Determine primary epic (most common among stories)
    epic_counts: dict[str, int] = {}
    for sid in story_ids:
        # F37-FK-001 -> F37-FK
        parts = sid.split("-")
        if len(parts) >= 2:
            ep = "-".join(parts[:2])
            epic_counts[ep] = epic_counts.get(ep, 0) + 1
    primary_epic = max(epic_counts, key=lambda k: epic_counts[k]) if epic_counts else "F37-01"

    target_branch = f"sprint/{sprint_num.zfill(2)}-{sprint_name.lower().replace(' ', '-')}"
    sprint_id = f"SPRINT-{sprint_num.zfill(2)}"

    manifest = {
        "sprint_id": sprint_id,
        "sprint_title": sprint_name,
        "target_branch": target_branch,
        "epic": primary_epic,
        "stories": stories,
    }

    manifest_json = json.dumps(manifest, indent=2, ensure_ascii=True)

    # Build the markdown document
    story_table_rows = "\n".join(
        f"| {s['id']} | {s['title'][:55]} | {s['wbs']} | {s['size']} |"
        for s in stories
    )

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = f"""<!-- SPRINT_MANIFEST
{manifest_json}
-->

# {sprint_id} -- {sprint_name}

Generated: {now}
Story IDs are canonical Veritas IDs from veritas-plan.json.
EVA-STORY tags in source files must use these exact IDs.

## Stories

| ID | Title | WBS | Size |
|----|-------|-----|------|
{story_table_rows}

## Execution Order

{chr(10).join(f"{i+1}. `{s['id']}` -- {s['title'][:60]}" for i, s in enumerate(stories))}

## Notes

- All story IDs verified against .eva/veritas-plan.json
- Fill in TODO fields before creating the GitHub issue
- Create issue with: gh issue create --repo eva-foundry/37-data-model --title "[{sprint_id}] {sprint_name}" --body-file .github/sprints/{sprint_id.lower()}-{sprint_name.lower().replace(' ', '-')}.md --label "sprint-task"
"""
    return doc


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a sprint manifest from Veritas story IDs")
    parser.add_argument("--stories", type=str, help="Comma-separated canonical story IDs (e.g. F37-FK-101,F37-FK-102)")
    parser.add_argument("--sprint", type=str, default="00", help="Sprint number (e.g. 01)")
    parser.add_argument("--name", type=str, default="", help="Sprint name suffix (e.g. 'fk-phase1a-store')")
    parser.add_argument("--sizes", type=str, default="", help="Per-story sizes: F37-FK-101=L,F37-FK-102=M")
    parser.add_argument("--list-done", action="store_true", help="List done stories and exit")
    parser.add_argument("--list-undone", action="store_true", help="List undone stories and exit")
    parser.add_argument("--output", type=str, default="", help="Output file path (default: .github/sprints/sprint-NN-name.md)")
    args = parser.parse_args()

    veritas = load_veritas()
    story_index = build_story_index(veritas)

    if args.list_done:
        list_stories(veritas, show_done=True)
        return
    if args.list_undone:
        list_stories(veritas, show_done=False)
        return

    if not args.stories:
        logger.error(format_status(STATUS_FAIL, "--stories is required (or use --list-undone to browse)"))
        logger.info("Example: python scripts/gen-sprint-manifest.py --sprint 01 --name 'fk-phase1a-store' --stories F37-FK-101,F37-FK-102,F37-FK-103")
        sys.exit(2)

    story_ids = [s.strip() for s in args.stories.split(",") if s.strip()]

    # Parse per-story sizes: "F37-FK-101=L,F37-FK-102=M"
    sizes: dict[str, str] = {}
    if args.sizes:
        for part in args.sizes.split(","):
            if "=" in part:
                sid, sz = part.strip().split("=", 1)
                sizes[sid.strip()] = sz.strip().upper()

    sprint_name = args.name or "stories"
    doc = generate_manifest(args.sprint, sprint_name, story_ids, story_index, sizes)

    if args.output:
        out_path = Path(args.output)
    else:
        SPRINTS_DIR.mkdir(parents=True, exist_ok=True)
        fname = f"sprint-{str(args.sprint).zfill(2)}-{sprint_name.lower().replace(' ', '-')}.md"
        out_path = SPRINTS_DIR / fname

    out_path.write_text(doc, encoding="utf-8", errors="replace")
    logger.info(format_status(STATUS_PASS, f"Sprint manifest written: {out_path}"))
    logger.info(format_status(STATUS_INFO, "Edit the TODO fields, then create the GitHub issue to trigger sprint-agent.yml"))


if __name__ == "__main__":
    # Professional Coding Standards: Setup logging with dual handlers
    logger = setup_logging('gen-sprint-manifest')
    ensure_directories()
    
    try:
        # Professional Coding Standards: Evidence at operation start
        save_evidence(
            operation="gen-sprint-manifest",
            status="started",
            metrics={"timestamp": datetime.utcnow().isoformat()}
        )
        
        logger.info(format_status(STATUS_INFO, "Script: gen-sprint-manifest"))
        
        # Run main operation
        main()
        
        # Professional Coding Standards: Evidence at completion
        save_evidence(
            operation="gen-sprint-manifest",
            status="completed",
            metrics={"timestamp": datetime.utcnow().isoformat()}
        )
    
    except SystemExit as e:
        # Allow normal exit codes from main()
        raise
    except Exception as e:
        # Professional Coding Standards: Structured error handling
        error_msg = f"Fatal error: {str(e)}"
        logger.error(format_status(STATUS_ERROR, error_msg))
        save_error_evidence(e, "gen-sprint-manifest")
        sys.exit(2)

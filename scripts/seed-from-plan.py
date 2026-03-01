"""
# EVA-STORY: F37-DPDCA-001
seed-from-plan.py -- parse PLAN.md and seed veritas-plan.json + data model WBS layer
======================================================================================
Parses PLAN.md into a structured hierarchy (epics -> features -> stories) and writes:
1. .eva/veritas-plan.json (complete WBS tree for veritas)
2. Data model WBS layer via HTTP API (POST /model/wbs/)

Story IDs are assigned sequentially per epic in the order they appear in PLAN.md.
Once assigned, IDs are stable (veritas-plan.json is the source of truth).

Encoding: ascii-only output (no emoji, no unicode).

Usage:
  python scripts/seed-from-plan.py                # read PLAN.md, write veritas + model
  python scripts/seed-from-plan.py --reseed-model # force re-POST all WBS to model (for schema changes)
  python scripts/seed-from-plan.py --dry-run      # parse only, no write
"""

import re
import sys
import json
import argparse
import requests
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

REPO_ROOT       = Path(__file__).parent.parent
PLAN_FILE       = REPO_ROOT / "PLAN.md"
STATUS_FILE     = REPO_ROOT / "STATUS.md"
ACCEPTANCE_FILE = REPO_ROOT / "ACCEPTANCE.md"
EVA_DIR         = REPO_ROOT / ".eva"
VERITAS_FILE    = EVA_DIR / "veritas-plan.json"

# Data model API base URL -- ACA production (24x7 Cosmos-backed)
DATA_MODEL_URL = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Regex patterns for PLAN.md parsing (37-data-model format)
# Epic:    "# Epic N -- Title"
# Feature: "## Feature: Title [ID=F37-NN]"
# Story:   "### Story: Title [ID=F37-NN-NNN]" (new format) OR "  Story N.M.K [F37-NN-NNN]  title" (old annotated format)
EPIC_TITLE_RE = re.compile(r"^#\s+Epic\s+(\d+)\s+--\s+(.+)$")
FEATURE_RE    = re.compile(r"^##\s+Feature:\s+(.+?)\s+\[ID=(F37-\d{2})\]$")
# Story new format (already has canonical ID):
STORY_NEW_RE  = re.compile(r"^###\s+Story:\s+(.+?)\s+\[ID=(F37-\d{2}-\d{3})\]$")
# Story old format (WBS with optional annotation):
STORY_OLD_RE  = re.compile(
    r"^(\s{2,6})Story\s+(\d+)\.(\d+)\.(\d+)"
    r"(?:\s+\[([A-Z]{2,5}-\d{2}-\d{3})\])?"
    r"\s{2,}(.+)$"
)
# Status declaration lines under stories:
STATUS_LINE_RE = re.compile(r"^\s*-\s+\*\*Status\*\*:\s*(.+)$")

# Done roster extraction from STATUS.md -- matches "- F37-NN-NNN (done YYYY-MM-DD)"
DONE_ROSTER_RE = re.compile(r"^\s*-\s+(F37-\d{2}-\d{3})\s+\(done\s+\d{4}-\d{2}-\d{2}\)\s*$", re.IGNORECASE)


def parse_done_roster(status_text: str) -> set[str]:
    """
    Extract all F37-NN-NNN IDs from STATUS.md "Done" roster.
    Returns set of canonical story IDs marked done.
    """
    done_ids = set()
    for line in status_text.splitlines():
        m = DONE_ROSTER_RE.match(line)
        if m:
            done_ids.add(m.group(1))
    return done_ids


def parse_plan(plan_text: str, done_ids: set[str]) -> dict:
    """
    Parse PLAN.md into structured epics dict.
    Returns: {
      "epics": [
        {
          "epic_n": int,
          "epic_title": str,
          "features": [
            {
              "feature_n": int,
              "feature_id": str (e.g. "F37-02"),
              "title": str,
              "stories": [
                {
                  "wbs": str (e.g. "2.5.4"),
                  "title": str,
                  "status": str | None,
                  "done": bool (from done_ids),
                  "epic_n": int,
                  "feature_n": int,
                }
              ]
            }
          ]
        }
      ]
    }
    
    Story counting: sequential within epic (same as reflect-ids.py).
    New-format stories (with [ID=F37-NN-NNN]) are counted; old-format stories get next number.
    """
    epics: list[dict] = []
    current_epic: dict | None = None
    current_feature: dict | None = None
    story_counters: dict[int, int] = {}  # epic_n -> story count

    for line in plan_text.splitlines():
        # Epic line
        m_epic = EPIC_TITLE_RE.match(line)
        if m_epic:
            ep_n = int(m_epic.group(1))
            ep_title = m_epic.group(2).strip()
            current_epic = {"epic_n": ep_n, "epic_title": ep_title, "features": []}
            epics.append(current_epic)
            current_feature = None
            story_counters[ep_n] = 0
            continue

        # Feature line
        m_feat = FEATURE_RE.match(line)
        if m_feat and current_epic:
            feat_title = m_feat.group(1).strip()
            feat_id = m_feat.group(2)  # "F37-02"
            try:
                feat_n = int(feat_id.split("-")[1])
            except (IndexError, ValueError):
                feat_n = 0
            current_feature = {
                "feature_n": feat_n,
                "feature_id": feat_id,
                "title": feat_title,
                "stories": [],
            }
            current_epic["features"].append(current_feature)
            continue

        # Story new format: "### Story: Title [ID=F37-NN-NNN]"
        m_story_new = STORY_NEW_RE.match(line)
        if m_story_new and current_feature:
            story_title = m_story_new.group(1).strip()
            story_id = m_story_new.group(2)  # "F37-02-017"
            ep_n = current_epic["epic_n"]
            feat_n = current_feature["feature_n"]
            
            # Count this story
            story_counters[ep_n] = story_counters.get(ep_n, 0) + 1
            story_seq = story_counters[ep_n]
            
            # Extract WBS from ID: F37-02-017 -> story number 017 within epic 02
            try:
                story_n = int(story_id.split("-")[2])
            except (IndexError, ValueError):
                story_n = story_seq
            
            wbs = f"{ep_n}.{feat_n}.{story_n}"
            current_feature["stories"].append({
                "wbs": wbs,
                "title": story_title,
                "status": None,
                "done": story_id in done_ids,
                "epic_n": ep_n,
                "feature_n": feat_n,
            })
            continue

        # Story old format: "  Story 2.5.4 [F37-02-017]  title"
        m_story_old = STORY_OLD_RE.match(line)
        if m_story_old and current_feature:
            ep_n = int(m_story_old.group(2))
            feat_n = int(m_story_old.group(3))
            story_n = int(m_story_old.group(4))
            annotation = m_story_old.group(5)  # may be None
            title = m_story_old.group(6).strip()
            
            # Count this story
            story_counters[ep_n] = story_counters.get(ep_n, 0) + 1
            
            wbs = f"{ep_n}.{feat_n}.{story_n}"
            # If annotated, check done roster
            done = annotation in done_ids if annotation else False
            current_feature["stories"].append({
                "wbs": wbs,
                "title": title,
                "status": None,
                "done": done,
                "epic_n": ep_n,
                "feature_n": feat_n,
            })
            continue

        # Status declaration under a story
        m_status = STATUS_LINE_RE.match(line)
        if m_status and current_feature and current_feature["stories"]:
            current_feature["stories"][-1]["status"] = m_status.group(1).strip()

    return {"epics": epics}


def build_veritas_plan(parsed: dict, done_ids: set[str]) -> dict:
    """
    Convert parsed PLAN.md into veritas-plan.json schema.
    Assign canonical IDs sequentially per epic.
    
    Schema:
    {
      "version": "2.0.0",
      "project": "37-data-model",
      "generated": "YYYY-MM-DDTHH:MM:SSZ",
      "features": [
        {
          "id": "F37-02",
          "title": "Feature title",
          "epic": "Epic 02 -- Data/API",
          "stories": [
            {
              "id": "F37-02-017",
              "wbs": "2.5.4",
              "title": "Story title",
              "status": "implemented" | "planned" | "stub",
              "done": bool,
              "epic_n": int,
              "feature_id": "F37-02",
              "blockers": [],
              "size": "M",
              "fp": 3,
            }
          ]
        }
      ]
    }
    """
    features: list[dict] = []
    story_counters: dict[int, int] = {}

    for epic in parsed.get("epics", []):
        ep_n = epic["epic_n"]
        ep_title = epic["epic_title"]
        epic_label = f"Epic {ep_n:02d} -- {ep_title}"
        story_counters[ep_n] = 0

        for feat in epic.get("features", []):
            feat_id = feat["feature_id"]  # "F37-02"
            feat_title = feat["title"]
            feat_entry = {
                "id": feat_id,
                "title": feat_title,
                "epic": epic_label,
                "stories": [],
            }

            for story_raw in feat.get("stories", []):
                story_counters[ep_n] += 1
                canonical_id = f"F37-{ep_n:02d}-{story_counters[ep_n]:03d}"
                
                # Determine status: done=True -> "implemented", has status text -> use it, else "planned"
                st = story_raw.get("status", "")
                if story_raw.get("done", False):
                    status = "implemented"
                elif st:
                    status = st
                else:
                    status = "planned"
                
                # Default size/FP (can be updated later via --sizes in gen-sprint-manifest.py)
                feat_entry["stories"].append({
                    "id": canonical_id,
                    "wbs": story_raw["wbs"],
                    "title": story_raw["title"],
                    "status": status,
                    "done": story_raw.get("done", False),
                    "epic_n": ep_n,
                    "feature_id": feat_id,
                    "blockers": [],
                    "size": "M",
                    "fp": 3,
                })

            features.append(feat_entry)

    return {
        "version": "2.0.0",
        "project": "37-data-model",
        "generated": datetime.now(timezone.utc).isoformat(),
        "features": features,
    }


def parse_status(status_text: str) -> dict:
    """
    Extract metadata from STATUS.md:
    - phase: current phase (e.g. "Phase0", "Phase1A")
    - active_epic: active epic ID (e.g. "F37-FK")
    - mti: MTI score (float)
    - decisions: list of recent decisions
    
    Returns: {
      "phase": str | None,
      "active_epic": str | None,
      "mti": float | None,
      "decisions": list[str],
    }
    """
    phase = None
    active_epic = None
    mti = None
    decisions = []

    for line in status_text.splitlines():
        if line.strip().startswith("**Phase**:"):
            m = re.search(r"Phase\**:\s*(.+)", line)
            if m:
                phase = m.group(1).strip()
        if line.strip().startswith("**Active Epic**:"):
            m = re.search(r"Active Epic\**:\s*(.+)", line)
            if m:
                active_epic = m.group(1).strip()
        if "MTI" in line and ":" in line:
            m = re.search(r"MTI[^:]*:\s*([\d.]+)", line)
            if m:
                try:
                    mti = float(m.group(1))
                except ValueError:
                    pass
        if line.strip().startswith("- DECISION"):
            decisions.append(line.strip())

    return {
        "phase": phase,
        "active_epic": active_epic,
        "mti": mti,
        "decisions": decisions,
    }


def parse_acceptance(acceptance_text: str) -> dict:
    """
    Extract quality gates from ACCEPTANCE.md.
    Returns: {
      "gates": list[str],  # e.g. ["MTI >= 95", "Zero P0 bugs"]
    }
    """
    gates = []
    for line in acceptance_text.splitlines():
        if line.strip().startswith("- [ ]") or line.strip().startswith("- [x]"):
            gate = line.strip()[5:].strip()
            if gate:
                gates.append(gate)
    return {"gates": gates}


def model_upsert(story: dict, dry_run: bool = False) -> None:
    """
    POST story to data model WBS layer via HTTP API.
    DELETE audit columns before PUT (layer, modified_by, modified_at, created_by, created_at, row_version, source_file).
    """
    url = f"{DATA_MODEL_URL}/model/wbs/"
    payload = {
        "id": story["id"],
        "label": story["title"],
        "wbs": story["wbs"],
        "epic_n": story["epic_n"],
        "feature_id": story["feature_id"],
        "status": story["status"],
        "done": story["done"],
        "blockers": story["blockers"],
        "size": story["size"],
        "fp": story["fp"],
        "is_active": True,
    }
    
    if dry_run:
        print(f"[DRY] POST {story['id']} -> {url}")
        return
    
    try:
        # Use PUT (not POST) -- data model API uses PUT for upsert
        put_url = f"{url}{story['id']}"
        resp = requests.put(
            put_url,
            json=payload,
            headers={"X-Actor": "agent:copilot", "Content-Type": "application/json"},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            print(f"[OK] {story['id']} upserted (row_version={resp.json().get('row_version', '?')})")
        else:
            print(f"[WARN] {story['id']} upsert failed: {resp.status_code} {resp.text[:100]}")
    except Exception as e:
        print(f"[ERROR] {story['id']} upsert exception: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed veritas-plan.json and data model WBS layer from PLAN.md")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, no write")
    parser.add_argument("--reseed-model", action="store_true", help="Force re-POST all WBS to data model")
    args = parser.parse_args()

    if not PLAN_FILE.exists():
        print(f"[FAIL] PLAN.md not found: {PLAN_FILE}")
        sys.exit(1)

    plan_text = PLAN_FILE.read_text(encoding="utf-8")
    
    # Parse STATUS.md for done roster
    done_ids = set()
    if STATUS_FILE.exists():
        status_text = STATUS_FILE.read_text(encoding="utf-8")
        done_ids = parse_done_roster(status_text)
        status_meta = parse_status(status_text)
        print(f"[INFO] STATUS.md: phase={status_meta.get('phase')}, active_epic={status_meta.get('active_epic')}, MTI={status_meta.get('mti')}")
        print(f"[INFO] Done roster: {len(done_ids)} stories marked done")
    
    # Parse ACCEPTANCE.md for gates (optional)
    if ACCEPTANCE_FILE.exists():
        acceptance_text = ACCEPTANCE_FILE.read_text(encoding="utf-8")
        acceptance_meta = parse_acceptance(acceptance_text)
        print(f"[INFO] ACCEPTANCE.md: {len(acceptance_meta.get('gates', []))} quality gates")

    # Parse PLAN.md
    parsed = parse_plan(plan_text, done_ids)
    veritas = build_veritas_plan(parsed, done_ids)
    
    total_stories = sum(len(feat["stories"]) for feat in veritas["features"])
    print(f"[PASS] Parsed {len(veritas['features'])} features, {total_stories} stories")

    if args.dry_run:
        print("[INFO] Dry run -- no write")
        return

    # Write veritas-plan.json
    EVA_DIR.mkdir(parents=True, exist_ok=True)
    VERITAS_FILE.write_text(json.dumps(veritas, indent=2, ensure_ascii=True), encoding="utf-8")
    print(f"[PASS] Wrote {VERITAS_FILE}")

    # Upsert to data model WBS layer
    if args.reseed_model:
        print("[INFO] Re-seeding data model WBS layer...")
        for feat in veritas["features"]:
            for story in feat["stories"]:
                model_upsert(story, dry_run=args.dry_run)
        print("[PASS] Data model WBS layer re-seeded")
    else:
        print("[INFO] Skip model upsert (use --reseed-model to force)")


if __name__ == "__main__":
    main()

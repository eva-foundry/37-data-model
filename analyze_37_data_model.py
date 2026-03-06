#!/usr/bin/env python3
"""
Analyze data model for project 37 (EVA Data Model)
"""
import requests
import json
from collections import Counter

base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

print("=" * 80)
print("DATA MODEL ANALYSIS FOR PROJECT 37 (EVA Data Model)")
print("=" * 80)

# 1. Layer summary
print("\n[1] LAYER INVENTORY")
print("-" * 80)
try:
    summary = requests.get(f"{base}/model/agent-summary").json()
    layers = summary.get('layers', {})
    print(f"Total Layers: {len(layers)} | Total Objects: {summary['total']}\n")
    
    sorted_layers = sorted(layers.items(), key=lambda x: x[1], reverse=True)
    for layer, count in sorted_layers:
        bar = '█' * max(1, count // 5)
        print(f"  {layer:<30} {count:>5} objects  {bar}")
    
except Exception as e:
    print(f"ERROR: {e}")

# 2. Project 37 details
print("\n[2] PROJECT 37 STATUS")
print("-" * 80)
try:
    proj = requests.get(f"{base}/model/projects/37-data-model").json()
    print(f"  ID:        {proj.get('id')}")
    print(f"  Label:     {proj.get('label')} ({proj.get('label_fr')})")
    print(f"  Status:    {proj.get('status').upper()}")
    print(f"  Maturity:  {proj.get('maturity')}")
    print(f"  Phase:     {proj.get('phase')}")
    print(f"  Category:  {proj.get('category')}")
    print(f"  PBIs:      {proj.get('pbi_done')}/{proj.get('pbi_total')} complete ({int(proj.get('pbi_done', 0)/proj.get('pbi_total', 1)*100)}%)")
    print(f"  Sprint:    {proj.get('sprint_context')}")
    print(f"  WBS ID:    {proj.get('wbs_id')}")
    print(f"  Goal:      {proj.get('goal')}")
    print(f"  Notes:     {proj.get('notes')}")
except Exception as e:
    print(f"ERROR: {e}")

# 3. WBS for project 37
print("\n[3] WBS ITEMS FOR PROJECT 37")
print("-" * 80)
try:
    wbs_resp = requests.get(f"{base}/model/wbs/?limit=100").json()
    wbs_items = [w for w in wbs_resp.get('data', []) if w.get('project_id') == '37-data-model']
    print(f"Total WBS Items: {len(wbs_items)}\n")
    
    for w in wbs_items:
        progress = f"{int(w.get('percent_complete', 0))}%" if w.get('percent_complete') else "N/A"
        print(f"  {w['id']:<15} [{w['level']:<12}] {w['label']:<45} {w['status']:<12} {progress}")
        if w.get('done_criteria'):
            print(f"    Done Criteria: {w['done_criteria'][:70]}...")
except Exception as e:
    print(f"ERROR: {e}")

# 4. Evidence for project 37
print("\n[4] EVIDENCE RECORDS FOR PROJECT 37")
print("-" * 80)
try:
    ev_resp = requests.get(f"{base}/model/evidence/?limit=100").json()
    ev_items = [e for e in ev_resp.get('data', []) if e.get('project_id') == '37-data-model']
    print(f"Total Evidence Records: {len(ev_items)}\n")
    
    if ev_items:
        for e in sorted(ev_items, key=lambda x: x.get('modified_at', ''), reverse=True):
            phase = e.get('phase', 'N/A')
            story = e.get('story_id', 'N/A')
            print(f"  {e['id']:<20} {phase:<10} {story:<15} {e['status']:<10}")
    else:
        print("  (No evidence records found for project 37)")
except Exception as e:
    print(f"ERROR: {e}")

# 5. Evidence by phase (all projects)
print("\n[5] EVIDENCE DISTRIBUTION BY PHASE (All Projects)")
print("-" * 80)
try:
    phases = Counter()
    for e in ev_resp.get('data', []):
        phase = e.get('phase', 'unknown')
        phases[phase] += 1
    
    total_evidence = sum(phases.values())
    print(f"Total Evidence Records: {total_evidence}\n")
    
    for phase, count in sorted(phases.items(), key=lambda x: x[1], reverse=True):
        pct = int(count / total_evidence * 100) if total_evidence > 0 else 0
        bar = '█' * max(1, count // 2)
        print(f"  {phase:<20} {count:>4}  ({pct:>3}%)  {bar}")
except Exception as e:
    print(f"ERROR: {e}")

# 6. Project work items (PLAN, DO, CHECK, ACT)
print("\n[6] PROJECT WORK STATUS BY PHASE")
print("-" * 80)
try:
    wbs_by_phase = {}
    for w in wbs_items:
        status = w.get('status', 'unknown')
        wbs_by_phase[status] = wbs_by_phase.get(status, 0) + 1
    
    print(f"WBS Status Distribution:")
    for status, count in sorted(wbs_by_phase.items(), key=lambda x: x[1], reverse=True):
        print(f"  {status:<20} {count:>3} items")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 80)
print("SUMMARY: Project 37 has all work (WBS, Evidence) in shared data model layers")
print("=" * 80)

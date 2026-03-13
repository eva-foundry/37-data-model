#!/usr/bin/env python3
"""
Add Test IDs to Batch 1 components (Layers 25-46)
Processes React components and adds data-testid attributes
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

# Batch 1 layers to process
BATCH1_LAYERS = {
    'projects': 'L25',
    'wbs': 'L26',
    'sprints': 'L27',
    'stories': 'L28',
    'tasks': 'L29',
    'evidence': 'L31',
    'quality_gates': 'L34',
    'work_step_events': 'L38',
    'relationships': 'L40',
    'ontology_mapping': 'L41',
    'system_metrics': 'L42',
    'adoption_metrics': 'L43',
    'verification_records': 'L45',
    'project_work': 'L46',
    'agents': 'L03',
    'agent_tools': 'L04',
    'deployment_targets': 'L12',
    'deployments': 'L13',
    'execution_logs': 'L14',
    'execution_traces': 'L15'
}

COMPONENTS_DIR = Path(__file__).parent.parent / 'ui' / 'src' / 'components'
UI_DIR = Path(__file__).parent.parent / 'ui'

def get_component_type(filename):
    """Determine component type from filename"""
    if 'ListView' in filename or 'List' in filename:
        return 'list'
    elif 'CreateForm' in filename or 'Create' in filename:
        return 'create-form'
    elif 'EditForm' in filename or 'Edit' in filename:
        return 'edit-form'
    elif 'DetailDrawer' in filename or 'Detail' in filename:
        return 'detail'
    elif 'GraphView' in filename or 'Graph' in filename:
        return 'graph'
    else:
        return 'component'

def add_testids_to_component(layer_name, filepath, dry_run=False):
    """Add test IDs to a React component file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False, f"Error reading file: {e}"
    
    component_type = get_component_type(filepath.name)
    changes = 0
    
    # Add test ID to main container if missing
    if 'data-testid=' not in content:
        # Add to main component JSX return
        if f'<div' in content or '<form' in content:
            # Simple heuristic: add to first container
            if '<form' in content:
                content = content.replace(
                    '<form',
                    f'<form data-testid="{layer_name}-{component_type}-form"',
                    1
                )
            elif '<div' in content and 'data-testid=' not in content:
                # Find first <div> and add testid if it doesn't have one
                pattern = r'<div([^>]*?)>'
                match = re.search(pattern, content)
                if match and 'data-testid=' not in match.group(1):
                    old_div = match.group(0)
                    new_div = old_div.replace('<div', f'<div data-testid="{layer_name}-{component_type}"')
                    content = content.replace(old_div, new_div, 1)
                    changes += 1
    
    if changes > 0 and not dry_run:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, f"Added {changes} test ID(s)"
        except Exception as e:
            return False, f"Error writing file: {e}"
    elif changes > 0:
        return True, f"Would add {changes} test ID(s) [DRY RUN]"
    else:
        return True, "No changes needed (already has test IDs)"

def main():
    print("[BATCH 1] Adding Test IDs to Components")
    print("=" * 60)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target Layers: {len(BATCH1_LAYERS)}")
    print(f"Components Dir: {COMPONENTS_DIR}")
    print()
    
    total_files = 0
    processed_files = 0
    errors = 0
    
    for layer_name, layer_id in BATCH1_LAYERS.items():
        layer_dir = COMPONENTS_DIR / layer_name
        
        if not layer_dir.exists():
            print(f"[SKIP] {layer_name} ({layer_id}) - directory not found")
            continue
        
        tsx_files = list(layer_dir.glob('*.tsx'))
        if not tsx_files:
            print(f"[SKIP] {layer_name} ({layer_id}) - no .tsx files")
            continue
        
        print(f"[PROCESS] {layer_name.upper()} ({layer_id})")
        for tsx_file in tsx_files:
            total_files += 1
            success, message = add_testids_to_component(layer_name, tsx_file, dry_run=False)
            if success:
                processed_files += 1
                print(f"  + {tsx_file.name}: {message}")
            else:
                errors += 1
                print(f"  - {tsx_file.name}: {message}")
        print()
    
    print("=" * 60)
    print(f"[SUMMARY]")
    print(f"  Total Files: {total_files}")
    print(f"  Processed: {processed_files}")
    print(f"  Errors: {errors}")
    print(f"  Success Rate: {(processed_files/total_files*100):.1f}%" if total_files > 0 else "  Success Rate: N/A")
    print()
    print("Next Steps:")
    print(f"  1. cd {UI_DIR}")
    print("  2. npm run type-check")
    print("  3. npm run lint -- src/components")
    print("  4. npm run format -- src/components")
    print("  5. npm run test:e2e -- --grep \"Functional\" --project=chromium")
    print()
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == '__main__':
    main()

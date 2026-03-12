import json
import os

stub_layers = [
    "traces", "work_execution_units", "work_decision_records", "work_outcomes",
    "work_factory_capabilities", "work_factory_governance", "work_factory_investments",
    "work_factory_metrics", "work_factory_portfolio", "work_factory_roadmaps", "work_factory_services",
    "work_obligations", "work_learning_feedback", "work_pattern_applications",
    "work_pattern_performance_profiles", "work_reusable_patterns",
    "work_service_breaches", "work_service_level_objectives", "work_service_lifecycle",
    "work_service_perf_profiles", "work_service_remediation_plans", "work_service_requests",
    "work_service_revalidation_results", "work_service_runs"
]

files_with_data = []
empty_files = []

for layer in stub_layers:
    file_path = f"c:\\eva-foundry\\37-data-model\\model\\{layer}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = json.load(f)
    
    count = 0
    # Check different JSON structures
    if isinstance(content, list):
        count = len(content)
    elif layer in content and isinstance(content[layer], list):
        count = len(content[layer])
    elif 'objects' in content and isinstance(content['objects'], list):
        count = len(content['objects'])
    
    if count > 0:
        files_with_data.append(f"{layer} ({count} objects)")
    else:
        empty_files.append(layer)

print(f"\n[DISCOVER COMPLETE] Stub layer analysis:")
print(f"  Files WITH data: {len(files_with_data)}")
print(f"  Empty files: {len(empty_files)}")
print(f"\n[+] Files with data (READY TO SEED):")
for item in files_with_data:
    print(f"    {item}")
print(f"\n[-] Empty files (need generation):")
for item in empty_files:
    print(f"    {item}")

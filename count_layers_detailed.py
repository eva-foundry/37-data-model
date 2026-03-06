import json
import os

model_path = r"C:\AICOE\eva-foundry\37-data-model\model"

print("\n" + "="*70)
print("DATA MODEL LAYER INVENTORY - DETAILED STRUCTURE")
print("="*70 + "\n")

print(f"{'Layer':<35} {'Type':<15} {'Count':>10}")
print("-" * 62)

total_arrays = 0
total_objects = 0
file_count = 0

for file in sorted(os.listdir(model_path)):
    if file.endswith('.json'):
        filepath = os.path.join(model_path, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            file_count += 1
            
            if isinstance(data, list):
                count = len(data)
                data_type = "Array"
                total_arrays += count
            elif isinstance(data, dict):
                if 'data' in data and isinstance(data['data'], list):
                    count = len(data['data'])
                    data_type = "Object[]"
                    total_arrays += count
                elif 'objects' in data and isinstance(data['objects'], list):
                    count = len(data['objects'])
                    data_type = "Objects[]"
                    total_arrays += count
                else:
                    count = 1
                    data_type = "Object"
                    total_objects += 1
            else:
                count = 1
                data_type = "Scalar"
                total_objects += 1
            
            print(f"{file:<35} {data_type:<15} {count:>10}")
        except Exception as e:
            print(f"{file:<35} {'ERROR':<15}")

print("-" * 62)
print(f"{'TOTAL':<35} {'Files: ' + str(file_count):<15} {(total_arrays + total_objects):>10}")
print(f"  - Array elements: {total_arrays}")
print(f"  - Single objects: {total_objects}")
print("="*70 + "\n")

import json
import os

model_path = r"C:\eva-foundry\37-data-model\model"

print("\n" + "="*60)
print("DATA MODEL LAYER INVENTORY - OBJECT COUNT BY LAYER")
print("="*60 + "\n")

print(f"{'Layer':<40} {'Count':>10}")
print("-" * 52)

total = 0
for file in sorted(os.listdir(model_path)):
    if file.endswith('.json'):
        filepath = os.path.join(model_path, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict):
                if 'data' in data and isinstance(data['data'], list):
                    count = len(data['data'])
                elif 'objects' in data and isinstance(data['objects'], list):
                    count = len(data['objects'])
                else:
                    count = 1
            else:
                count = 1
            
            total += count
            print(f"{file:<40} {count:>10}")
        except Exception as e:
            print(f"{file:<40} ERROR")

print("-" * 52)
print(f"{'TOTAL':<40} {total:>10}")
print("="*60 + "\n")

import json
import os

model_path = r"C:\AICOE\eva-foundry\37-data-model\model"

print("\n" + "="*75)
print("DATA MODEL LAYER INVENTORY - COMPLETE OBJECT COUNT")
print("="*75 + "\n")

print(f"{'Layer':<35} {'Type':<18} {'Count':>12}")
print("-" * 68)

total_count = 0
layer_list = []

for file in sorted(os.listdir(model_path)):
    if file.endswith('.json'):
        filepath = os.path.join(model_path, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Determine count
            if isinstance(data, list):
                count = len(data)
                data_type = "Array"
            elif isinstance(data, dict):
                # Check for common array keys
                if 'objects' in data and isinstance(data['objects'], list):
                    count = len(data['objects'])
                    data_type = "objects[]"
                elif 'records' in data and isinstance(data['records'], list):
                    count = len(data['records'])
                    data_type = "records[]"
                elif 'data' in data and isinstance(data['data'], list):
                    count = len(data['data'])
                    data_type = "data[]"
                elif 'items' in data and isinstance(data['items'], list):
                    count = len(data['items'])
                    data_type = "items[]"
                else:
                    count = 1
                    data_type = "Object (metadata)"
            else:
                count = 1
                data_type = "Scalar"
            
            total_count += count
            layer_list.append((file, data_type, count))
            print(f"{file:<35} {data_type:<18} {count:>12,}")
        except Exception as e:
            print(f"{file:<35} {'ERROR':<18} {0:>12}")

print("-" * 68)
print(f"{'TOTAL (' + str(len(layer_list)) + ' layers)':<35} {'':18} {total_count:>12,}")
print("="*75 + "\n")

# Summary by type
print("SUMMARY BY CATEGORY:\n")

array_layers = [x for x in layer_list if x[2] > 1]
object_layers = [x for x in layer_list if x[2] == 1]

if array_layers:
    print(f"Layers with multiple records ({len(array_layers)}):")
    array_total = 0
    for name, dtype, count in sorted(array_layers, key=lambda x: x[2], reverse=True):
        print(f"  - {name:<40} {count:>8,} objects")
        array_total += count
    print(f"  Subtotal: {array_total:,} objects\n")

print(f"Metadata layers ({len(object_layers)}):")
print(f"  {len(object_layers)} singleton configuration/metadata objects\n")

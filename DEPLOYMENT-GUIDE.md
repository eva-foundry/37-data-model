# EVA Factory Deployment Guide

## Organization: Configuration-Driven Standalone Product

EVA Factory is architected as a **standalone, configuration-driven product** that can be deployed in any workspace structure without code changes.

### Key Principle: Zero Hardcoded Literals

- ✅ **No hardcoded paths** - All paths defined in `eva-factory.config.yaml`
- ✅ **No hardcoded field names** - All schema fields configurable
- ✅ **No hardcoded schedules** - All automation schedules in config
- ✅ **No hardcoded logic** - All thresholds and gates in config
- ✅ **Fully portable** - Deploy same codebase to any workspace/environment

---

## Quick Start: Default Deployment

### Prerequisites
- Python 3.10+
- PyYAML: `pip install pyyaml`

### 1. Clone to Your Workspace

```bash
# Option A: Clone entire EVA Factory repository
git clone https://github.com/eva-foundry/37-data-model.git
cd 37-data-model

# Option B: Copy just the scripts + config
cp -r scripts/ config/ your-workspace/eva-factory/
cp eva-factory.config.yaml your-workspace/eva-factory/
```

### 2. Run Discovery Orchestrator

```bash
# Default behavior (uses eva-factory.config.yaml in current/parent dirs)
python scripts/sync-evidence-all-projects.py /path/to/workspace /path/to/37-data-model

# With explicit config file
EVA_CONFIG_FILE=/etc/eva-factory.yaml \
  python scripts/sync-evidence-all-projects.py /path/to/workspace /path/to/37-data-model
```

### 3. Review Output

```
[STAGE 1] EXTRACT: Scanning workspace for evidence...
  [OK] 51-ACA: 64 files -> 64 transformed -> 63 merged

[STAGE 2] MERGE: Consolidating records into portfolio...
  Total files: 64

[STAGE 3] VALIDATE: Portfolio-wide validation...
  Total records: 63
  Pass: 11 (17.5%)

[STAGE 4] REPORT: Generating sync report...
  Report: /path/to/37-data-model/model/reports/sync-evidence-report.json
```

---

## Customization: Deployment-Specific Configuration

### Scenario 1: Production Deployment

**Requirement**: Different evidence directory path, stricter validation gate

```bash
# Step 1: Copy config template
cp eva-factory.config.yaml /etc/eva-factory-prod.yaml

# Step 2: Edit config
cat > /etc/eva-factory-prod.yaml << 'EOF'
factory:
  name: "eva-factory"
  version: "1.0.0"

storage:
  projects_registry: "model/projects.json"
  evidence_root: "/var/eva/evidence"          # ← Production path
  evidence_consolidated: "/var/eva/evidence.json"
  reports_dir: "/var/log/eva/reports"

validation:
  gates:
    pass_threshold: 0.25                      # ← Stricter: 25% instead of 15%
    fail_threshold: 0.40
    warn_threshold: 0.50

# ... rest of config
EOF

# Step 3: Run with custom config file
EVA_CONFIG_FILE=/etc/eva-factory-prod.yaml \
  python scripts/sync-evidence-all-projects.py /data/workspace /data/eva-factory/37-data-model
```

### Scenario 2: Development Deployment

**Requirement**: Local testing, verbose logging, different field mappings

```bash
# Create development config
cat > ~/.eva/config-dev.yaml << 'EOF'
factory:
  name: "eva-factory-dev"

storage:
  projects_registry: "model/projects.json"
  evidence_root: ".eva/evidence"
  evidence_consolidated: "model/evidence-dev.json"  # Separate dev data

logging:
  level: "DEBUG"        # ← Verbose logging
  file: "/tmp/eva-dev.log"

validation:
  gates:
    pass_threshold: 0.10  # ← Loose for testing

schema:
  fields:
    story_id: "custom_story_field"   # ← Custom field mapping
    phase: "custom_phase_field"

# ... rest of config
EOF

# Run with dev config
EVA_CONFIG_FILE=~/.eva/config-dev.yaml \
  python scripts/sync-evidence-all-projects.py ~/workspace ~/workspace/37-data-model
```

### Scenario 3: Custom Schema Fields

**Requirement**: Different evidence field names for legacy systems

```yaml
# In eva-factory.config.yaml or custom deployment config

schema:
  fields:
    # Old system uses different field names
    story_id: "task_id"              # ← Map to "task_id" instead
    phase: "workflow_stage"          # ← Map to "workflow_stage"
    timestamp: "created_date"
    test_result: "qa_result"
    
  # Phase mapping for legacy system
  phase_map:
    "D": "discovery"
    "P": "proposal"
    "C": "confirmation"
    "A": "approval"
    
  # Sprint ID uses different parts count
  sprint_id_parts: 3                 # ← Custom parts (e.g., "PROJ-2026-03-015" → "PROJ-2026-03")
```

---

## Configuration Reference

### Core Sections

#### `factory`
Global metadata about the deployment

```yaml
factory:
  name: "eva-factory"
  version: "1.0.0"
  description: "Evidence and Versioning Automation Framework"
```

#### `storage`
All filesystem paths (relative or absolute)

```yaml
storage:
  projects_registry: "model/projects.json"      # Where projects are listed
  evidence_root: ".eva/evidence"                 # Project evidence directory
  evidence_consolidated: "model/evidence.json"  # Consolidated portfolio
  reports_dir: "model/reports"                   # Sync reports location
```

#### `schema`
Data model configuration

```yaml
schema:
  evidence_file: "schema/evidence.schema.json"
  fields:
    story_id: "story_id"
    phase: "phase"
    timestamp: "timestamp"
    test_result: "test_result"
  
  # How phases map from input to canonical
  phase_map:
    "D": "D3"
    "P": "P"
    "C": "C"
    "A": "A"
  
  # Number of parts to use for sprint inference
  # E.g., "ACA-2026-03-015" with sprint_id_parts=2 → "ACA-2026"
  sprint_id_parts: 2
```

#### `validation`
Quality gates and completeness checks

```yaml
validation:
  gates:
    status_values: ["PASS", "FAIL", "SKIP", "WARN"]
    pass_threshold: 0.15      # 15% = PASS
    fail_threshold: 0.50
    warn_threshold: 0.30
  
  required_fields: ["id", "project_id", "story_id", "created_at"]
  optional_fields: ["commits", "artifacts", "description"]
```

#### `automation`
Scheduling and batch processing

```yaml
automation:
  schedules:
    sync_51_aca: "0 8 * * *"        # Phase 2: 08:00 UTC daily
    sync_portfolio: "30 8 * * *"    # Phase 3: 08:30 UTC daily
  
  batch:
    max_files_per_extract: 1000
    max_records_per_merge: 10000
    timeout_seconds: 300
  
  retry:
    max_attempts: 3
    backoff_seconds: 5
```

#### `reporting`
Output and metrics

```yaml
reporting:
  report_file: "model/reports/sync-evidence-report.json"
  metrics:
    - "status"
    - "duration_ms"
    - "total_records_merged"
    - "validation_rate"
```

#### `project_discovery`
How to find projects with evidence

```yaml
project_discovery:
  source: "projects.json"        # Where to load projects from
  filter:
    requires_active: true         # Only active projects
    requires_folder: true         # Only projects with folder field
    skip_ids: []                  # Projects to exclude
  
  structure:
    evidence_dir: ".eva/evidence"  # Where to look for evidence files
    evidence_format: "json"       # File format to process
```

---

## Deploying to Different Environments

### Kubernetes / Container

**Problem**: Config file location not known at container build time

**Solution**: Mount config as ConfigMap

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eva-factory
spec:
  containers:
  - name: eva-factory
    image: eva-factory:latest
    env:
    - name: EVA_CONFIG_FILE
      value: /etc/eva/config.yaml
    volumeMounts:
    - name: config
      mountPath: /etc/eva/config.yaml
      subPath: config.yaml
  volumes:
  - name: config
    configMap:
      name: eva-factory-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: eva-factory-config
data:
  config.yaml: |
    factory:
      name: "eva-factory"
    storage:
      projects_registry: "/data/projects.json"
      evidence_root: "/data/.eva/evidence"
    # ... rest of config
```

### Docker

**Problem**: Config needs to be environment-specific

**Solution**: COPY default, ENV override

```dockerfile
FROM python:3.11

WORKDIR /app

RUN pip install pyyaml

# Copy default config + scripts
COPY eva-factory.config.yaml .
COPY scripts/ scripts/

# Allow runtime config override
ENV EVA_CONFIG_FILE=./eva-factory.config.yaml

ENTRYPOINT ["python", "scripts/sync-evidence-all-projects.py"]
```

**Run with custom config**:
```bash
docker run \
  -e EVA_CONFIG_FILE=/config/production.yaml \
  -v /etc/eva-config:/config \
  eva-factory /workspace /data-model
```

### GitHub Actions / Azure Pipelines

**Problem**: Secrets and deployment paths vary by environment

**Solution**: Use job environment / matrix

```yaml
# .github/workflows/sync-portfolio.yml
name: Portfolio Sync

on:
  schedule:
    - cron: '30 8 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        env: [dev, staging, production]
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: pip install pyyaml
    
    - name: Create deployment config
      run: |
        cat > eva-factory.${{ matrix.env }}.yaml << 'EOF'
        factory:
          name: eva-factory-${{ matrix.env }}
        storage:
          evidence_root: ${{ vars.EVIDENCE_ROOT_${{ matrix.env }} }}
        validation:
          gates:
            pass_threshold: ${{ vars.PASS_THRESHOLD_${{ matrix.env }} }}
        EOF
    
    - name: Run sync orchestrator
      run: |
        EVA_CONFIG_FILE=eva-factory.${{ matrix.env }}.yaml \
          python scripts/sync-evidence-all-projects.py \
            ${{ vars.WORKSPACE_PATH }} \
            ${{ vars.DATA_MODEL_PATH }}
```

---

## Troubleshooting

### Config File Not Found

```
ERROR: eva-factory.config.yaml not found.
Set EVA_CONFIG_FILE env var or place config in current/parent directory
```

**Solution**:
```bash
# Option 1: Set explicit path
EVA_CONFIG_FILE=/etc/eva-factory.yaml python ...

# Option 2: Copy to expected location
cp eva-factory.config.yaml .

# Option 3: Copy to parent directory
cp eva-factory.config.yaml ..
```

### Evidence Directory Not Found

```
WARNING: Schema file not found at /path/to/schema/evidence.schema.json
```

**Check**: `storage.evidence_root` in config matches actual folder structure

```yaml
# If actual path is /var/eva/.evidence/files, then:
storage:
  evidence_root: ".evidence/files"  # ← Relative to project
```

### Wrong Field Mappings

**Error**: Evidence records have different field names but config still using old names

**Solution**: Update `schema.fields` in config to match actual field names

```yaml
schema:
  fields:
    story_id: "task_id"        # ← Changed from "story_id"
    phase: "workflow_phase"    # ← Changed from "phase"
```

---

## Maintenance & Upgrades

### Config Migration for New Versions

When upgrading EVA Factory:

1. **Check release notes** for new config sections
2. **Compare configs**:
   ```bash
   diff eva-factory.config.yaml eva-factory-v1.1.0.config.yaml
   ```
3. **Merge changes**:
   ```bash
   # Merge new sections into your deployment config
   cat eva-factory-v1.1.0.config.yaml >> your-deployment-config.yaml
   ```
4. **Test**: Run with new config in dev environment first
5. **Deploy**: Update production config and roll out

---

## Summary: The Configuration-as-Product Model

| Aspect | Before | After |
|--------|--------|-------|
| **Code Changes for Deployment** | Modify source code | Change config file only |
| **Field Names** | Hardcoded in Python | Configurable in YAML |
| **Paths** | Hardcoded in Python | Configurable in YAML |
| **Schedules** | Hardcoded in Python | Configurable in YAML |
| **Validation Gates** | Hardcoded in Python | Configurable in YAML |
| **Reusability** | Workspace-specific | Truly portable product |
| **Deployment Complexity** | Medium | Simple config + same code |

**Result**: EVA Factory can now be deployed as a true independent product across any workspace structure without any code modifications.

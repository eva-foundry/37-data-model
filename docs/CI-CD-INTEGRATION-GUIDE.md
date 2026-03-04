# CI/CD Integration Guide - Evidence Layer Sync

**Status**: Phase 2 - Automated Synchronization
**Date**: 2026-03-03  
**Updated**: After Phase 1 backfill (63 records synced successfully)

## Overview

This guide documents how to integrate the evidence synchronization process with various CI/CD platforms. All approaches follow the same orchestration pattern:

```
Extract (51-ACA/.eva/evidence/) 
  → Transform (to canonical schema) 
  → Merge (into 37-data-model/model/evidence.json) 
  → Validate (against evidence.schema.json) 
  → Report (sync-evidence-report.json)
```

## Quick Start

### GitHub Actions (Recommended)

**Status**: ✅ Implemented  
**Trigger**: Daily at 08:00 UTC + Manual via `workflow_dispatch`  
**File**: `.github/workflows/sync-51-aca-evidence.yml`

```bash
# Workflow file already created, just commit and push:
cd /path/to/37-data-model
git add .github/workflows/sync-51-aca-evidence.yml
git commit -m "feat: Phase 2 evidence sync automation"
git push origin main

# Workflow will:
# - Run daily at 08:00 UTC
# - Execute on manual trigger (via GitHub UI)
# - Checkout both repos
# - Run Python script
# - Validate evidence.json
# - Commit changes [skip ci]
# - Report to GitHub Actions summary
```

### Local Development

```bash
# One-time setup
cd /path/to/37-data-model

# Bash/PowerShell wrapper (fully parameterized)
./scripts/sync-evidence.sh \
  --source-repo /path/to/51-ACA \
  --target-repo /path/to/37-data-model \
  --auto-commit \
  --verbose

# Direct Python execution
python scripts/sync-evidence-from-51-aca.py \
  /path/to/51-ACA \
  /path/to/37-data-model
```

## Platform Integration Guide

### 1. GitHub Actions (IMPLEMENTED)

**Advantages**:
- Native GitHub integration
- No additional setup required
- Automatic workflow discovery in .github/workflows/
- Built-in secrets management
- Environment matrix for parallel jobs
- Artifact storage and reporting
- Community actions ecosystem

**Configuration**:
```yaml
# File: .github/workflows/sync-51-aca-evidence.yml
name: Sync Evidence from 51-ACA

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 08:00 UTC
  workflow_dispatch:
    inputs:
      verbose:
        description: 'Enable verbose logging'
        required: false
        default: 'false'

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - name: Checkout 51-ACA
        uses: actions/checkout@v4
        with:
          repository: <owner>/eva-foundry
          path: sibling-repos/51-ACA
          sparse-checkout: 51-ACA/.eva/evidence/
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: requirements.txt
      - name: Install dependencies
        run: |
          pip install jsonschema
      - name: Run sync
        id: sync
        run: |
          cd ../../sibling-repos/51-ACA
          SOURCE_REPO=$(pwd)
          cd - > /dev/null
          python scripts/sync-evidence-from-51-aca.py "$SOURCE_REPO" .
          echo "exit_code=${?}" >> $GITHUB_OUTPUT
      - name: Validate schema
        run: |
          python -c "
          import json
          from jsonschema import validate, ValidationError
          with open('model/evidence.json') as f:
            data = json.load(f)
          with open('schema/evidence.schema.json') as f:
            schema = json.load(f)
          validate(data, schema)
          print('✓ evidence.json valid')
          "
      - name: Check merge gates
        run: |
          python -c "
          import json
          with open('model/evidence.json') as f:
            data = json.load(f)
          failures = [o for o in data['objects'] 
                     if o['validation'].get('test_result') == 'FAIL'
                     or o['validation'].get('lint_result') == 'FAIL']
          if failures:
            print(f'⚠ {len(failures)} merge-blocking failures found')
            exit(1)
          print('✓ No merge-blocking gates')
          "
      - name: Commit changes
        if: success()
        run: |
          git config user.name "Evidence Sync Bot"
          git config user.email "bot@eva.local"
          git add model/evidence.json sync-evidence-report.json
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: sync evidence from 51-ACA [skip ci]"
            git push
            echo "has_changes=true" >> $GITHUB_ENV
          fi
      - name: GitHub Summary
        if: always()
        run: |
          echo "## Evidence Sync Report" >> $GITHUB_STEP_SUMMARY
          if [ -f sync-evidence-report.json ]; then
            python -c "
            import json
            with open('sync-evidence-report.json') as f:
              report = json.load(f)
            print(f\"Status: {report['status']}\")
            print(f\"Records: {report['merged_count']}\")
            print(f\"Duration: {report['duration_ms']}ms\")
            " >> $GITHUB_STEP_SUMMARY
          fi
```

**Verification**:
```bash
# After push, verify workflow is registered:
# 1. Go to GitHub repo → Actions tab
# 2. Should see "Sync Evidence from 51-ACA" workflow
# 3. Next scheduled run: Tomorrow at 08:00 UTC
# 4. To test immediately: Click "Run workflow" → "Run workflow" button

# Check workflow status:
gh workflow list
gh workflow view "Sync Evidence from 51-ACA"
```

---

### 2. Azure Pipelines

**Advantages**:
- Power in YAML syntax
- Integration with Azure DevOps
- Conditional stages
- Variable groups for secrets
- Multi-stage pipelines
- Built-in artifact publishing

**Configuration**:
```yaml
# File: azure-pipelines.yml
trigger:
  schedule:
  - cron: "0 8 * * *"
    displayName: Daily evidence sync (08:00 UTC)
    branches:
      include:
      - main
    always: true

pr: none
# Manual trigger via "Run pipeline" button in Azure DevOps UI

pool:
  vmImage: 'ubuntu-latest'

variables:
  pythonVersion: '3.11'

stages:
- stage: Sync
  displayName: 'Sync Evidence'
  jobs:
  - job: SyncEvidence
    displayName: 'Run Sync Script'
    steps:
    
    - checkout: self
      fetchDepth: 0
    
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '$(pythonVersion)'
      displayName: 'Use Python $(pythonVersion)'
    
    - task: Bash@3
      inputs:
        targetType: 'inline'
        script: |
          # Download 51-ACA repo to sibling location
          cd ..
          git clone --depth=1 \
            https://dev.azure.com/<organization>/<project>/_git/51-ACA \
            51-ACA
          cd 37-data-model
      displayName: 'Checkout sibling 51-ACA'
    
    - task: Bash@3
      inputs:
        targetType: 'inline'
        script: |
          cd $(System.DefaultWorkingDirectory)
          python scripts/sync-evidence-from-51-aca.py \
            ../51-ACA \
            .
      displayName: 'Run Evidence Sync'
    
    - task: Bash@3
      inputs:
        targetType: 'inline'
        script: |
          pip install jsonschema
          python -c "
          import json
          from jsonschema import validate
          with open('model/evidence.json') as f:
            data = json.load(f)
          with open('schema/evidence.schema.json') as f:
            schema = json.load(f)
          validate(instance=data, schema=schema)
          print('✓ Schema validation passed')
          "
      displayName: 'Validate Evidence Schema'
    
    - task: Bash@3
      inputs:
        targetType: 'inline'
        script: |
          python -c "
          import json
          with open('model/evidence.json') as f:
            data = json.load(f)
          test_fails = len([o for o in data['objects'] 
                           if o['validation'].get('test_result') == 'FAIL'])
          lint_fails = len([o for o in data['objects'] 
                           if o['validation'].get('lint_result') == 'FAIL'])
          if test_fails > 0 or lint_fails > 0:
            print(f'##[warning] {test_fails} test failures, {lint_fails} lint failures')
          print(f'##[section] {len(data[\"objects\"])} evidence records')
          "
      displayName: 'Check Merge Gates'
    
    - task: Bash@3
      inputs:
        targetType: 'inline'
        script: |
          # Configure git for commit
          git config user.name "Azure Pipeline Bot"
          git config user.email "pipeline@eva.local"
          
          # Stage and commit changes
          git add model/evidence.json sync-evidence-report.json
          if ! git diff --cached --quiet; then
            git commit -m "chore: sync evidence from 51-ACA [skip ci]"
            git push
            echo "##[debug] Changes committed and pushed"
          else
            echo "##[debug] No changes to commit"
          fi
      condition: succeeded()
      displayName: 'Commit Changes'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'model/evidence.json'
        artifactName: 'evidence-snapshot'
      displayName: 'Publish Evidence Artifact'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'sync-evidence-report.json'
        artifactName: 'sync-report'
      displayName: 'Publish Sync Report'
```

**Verification**:
```bash
# Test locally with Azure Pipelines CLI
az pipelines run --name "Sync Evidence" --branch main

# Check execution history
az pipelines runs list --pipeline-ids <id> --status completed

# View latest execution
az pipelines runs show --id <run-id>
```

---

### 3. GitLab CI/CD

**Advantages**:
- Native to GitLab
- Powerful caching mechanisms
- Scheduled pipelines
- Container registry integration
- Artifact retention policies

**Configuration**:
```yaml
# File: .gitlab-ci.yml (add to existing)
stages:
  - sync

variables:
  PYTHON_VERSION: "3.11"
  CACHE_KEY: "python-${PYTHON_VERSION}"

cache:
  paths:
    - .cache/pip

sync_evidence:
  stage: sync
  image: python:${PYTHON_VERSION}-slim
  
  script:
    # Clone sibling 51-ACA repo
    - cd /tmp
    - git clone --depth=1 https://gitlab.com/<group>/eva-foundry.git eva-foundry-sibling
    - cd $CI_PROJECT_DIR
    
    # Run sync
    - python scripts/sync-evidence-from-51-aca.py /tmp/eva-foundry-sibling/51-ACA .
    
    # Validate schema
    - pip install jsonschema
    - |
      python -c "
      import json
      from jsonschema import validate
      with open('model/evidence.json') as f:
        data = json.load(f)
      with open('schema/evidence.schema.json') as f:
        schema = json.load(f)
      validate(instance=data, schema=schema)
      print('✓ Schema validation passed')
      "
    
    # Check merge gates
    - |
      python -c "
      import json
      with open('model/evidence.json') as f:
        data = json.load(f)
      test_fails = len([o for o in data['objects'] 
                       if o['validation'].get('test_result') == 'FAIL'])
      lint_fails = len([o for o in data['objects'] 
                       if o['validation'].get('lint_result') == 'FAIL'])
      if test_fails > 0 or lint_fails > 0:
        print(f'⚠ {test_fails} test failures, {lint_fails} lint failures')
      "
    
    # Commit changes
    - |
      git config user.name "GitLab Pipeline Bot"
      git config user.email "pipeline@eva.local"
      git add model/evidence.json sync-evidence-report.json
      if git diff --cached --quiet; then
        echo "No changes to commit"
      else
        git commit -m "chore: sync evidence from 51-ACA [skip ci]"
        git push https://oauth2:${CI_JOB_TOKEN}@gitlab.com/${CI_PROJECT_PATH}.git main
      fi
  
  artifacts:
    name: "evidence-sync-${CI_PIPELINE_ID}"
    paths:
      - model/evidence.json
      - sync-evidence-report.json
    expire_in: 30 days
  
  only:
    - schedules
    - web  # Manual trigger from GitLab UI
  
  timeout: 15 minutes

# Schedule the pipeline in GitLab UI:
# Pipelines → Schedules → New schedule
# - Cron: 0 8 * * * (08:00 UTC dailyevery day)
# - Target: main branch
```

---

### 4. Jenkins

**Advantages**:
- Highly customizable
- Declarative and scripted pipelines
- Extensive plugin ecosystem
- Can run on-premise
- Strong GitOps support

**Configuration**:
```groovy
// File: Jenkinsfile (evidence-sync branch)
pipeline {
    agent {
        docker {
            image 'python:3.11-slim'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
    }
    
    triggers {
        // Cron: H 8 * * * means 08:00 UTC daily
        cron('H 8 * * *')
        // Allow manual trigger
        pollSCM('H/15 * * * *')
    }
    
    environment {
        PYTHON_VERSION = '3.11'
        GIT_AUTHOR_NAME = 'Jenkins Pipeline Bot'
        GIT_AUTHOR_EMAIL = 'jenkins@eva.local'
        REPO_DIR = "${WORKSPACE}"
        SOURCE_REPO = "${WORKSPACE}/../51-ACA"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                dir('..') {
                    sh '''
                        [ -d 51-ACA ] || git clone --depth=1 \
                            ${GIT_REPO_URL_51_ACA} 51-ACA
                    '''
                }
            }
        }
        
        stage('Setup') {
            steps {
                sh '''
                    python -m venv venv || true
                    . venv/bin/activate 2>/dev/null || true
                    pip install jsonschema
                '''
            }
        }
        
        stage('Sync') {
            steps {
                sh '''
                    cd "${REPO_DIR}"
                    python scripts/sync-evidence-from-51-aca.py \
                        "${SOURCE_REPO}" \
                        "${REPO_DIR}"
                '''
            }
        }
        
        stage('Validate') {
            steps {
                sh '''
                    cd "${REPO_DIR}"
                    python -c "
                    import json
                    from jsonschema import validate
                    with open('model/evidence.json') as f:
                        data = json.load(f)
                    with open('schema/evidence.schema.json') as f:
                        schema = json.load(f)
                    validate(instance=data, schema=schema)
                    print('✓ Schema validation passed')
                    "
                '''
            }
        }
        
        stage('Check Gates') {
            steps {
                sh '''
                    cd "${REPO_DIR}"
                    python -c "
                    import json
                    with open('model/evidence.json') as f:
                        data = json.load(f)
                    test_fails = len([o for o in data['objects'] 
                                     if o['validation'].get('test_result') == 'FAIL'])
                    lint_fails = len([o for o in data['objects'] 
                                     if o['validation'].get('lint_result') == 'FAIL'])
                    if test_fails > 0 or lint_fails > 0:
                        print(f'WARNING: {test_fails} test, {lint_fails} lint failures')
                    "
                '''
            }
        }
        
        stage('Commit') {
            when {
                expression {
                    sh(script: '''
                        cd "${REPO_DIR}"
                        git add model/evidence.json sync-evidence-report.json
                        ! git diff --cached --quiet
                    ''', returnStatus: true) == 0
                }
            }
            steps {
                sh '''
                    cd "${REPO_DIR}"
                    git config user.name "${GIT_AUTHOR_NAME}"
                    git config user.email "${GIT_AUTHOR_EMAIL}"
                    git commit -m "chore: sync evidence from 51-ACA [skip ci]"
                    git push origin main
                '''
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'model/evidence.json,sync-evidence-report.json',
                             allowEmptyArchive: true
            
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'sync-evidence-report.json',
                reportName: 'Evidence Sync Report'
            ])
        }
        
        failure {
            echo "Evidence sync failed. Check logs for details."
        }
        
        success {
            echo "Evidence sync completed successfully."
        }
    }
}
```

---

### 5. CircleCI

**Advantages**:
- Simple YAML syntax
- Good GitHub/Bitbucket integration
- Free credits for open source
- SSH-based step debugging

**Configuration**:
```yaml
# File: .circleci/config.yml
version: 2.1

workflows:
  sync-evidence:
    triggers:
      - schedule:
          cron: "0 8 * * *"
          filters:
            branches:
              only:
                - main

jobs:
  sync:
    docker:
      - image: cimg/python:3.11
    
    steps:
      - checkout
      
      - run:
          name: Checkout sibling 51-ACA
          command: |
            cd /tmp
            git clone --depth=1 \
              ${BITBUCKET_REPO_51_ACA_URL} 51-ACA
      
      - run:
          name: Run evidence sync
          command: |
            cd ~/project
            python scripts/sync-evidence-from-51-aca.py /tmp/51-ACA .
      
      - run:
          name: Validate schema
          command: |
            pip install jsonschema
            python -c "
            import json
            from jsonschema import validate
            with open('model/evidence.json') as f:
              data = json.load(f)
            with open('schema/evidence.schema.json') as f:
              schema = json.load(f)
            validate(instance=data, schema=schema)
            print('✓ Schema validation passed')
            "
      
      - run:
          name: Check merge gates
          command: |
            python -c "
            import json
            with open('model/evidence.json') as f:
              data = json.load(f)
            test_fails = len([o for o in data['objects'] 
                             if o['validation'].get('test_result') == 'FAIL'])
            lint_fails = len([o for o in data['objects'] 
                             if o['validation'].get('lint_result') == 'FAIL'])
            print(f'Test failures: {test_fails}, Lint failures: {lint_fails}')
            "
      
      - run:
          name: Commit changes
          command: |
            git config user.name "CircleCI Bot"
            git config user.email "circleci@eva.local"
            git add model/evidence.json sync-evidence-report.json
            if ! git diff --cached --quiet; then
              git commit -m "chore: sync evidence from 51-ACA [skip ci]"
              git push origin main
            fi
      
      - store_artifacts:
          path: sync-evidence-report.json
          destination: sync-report
      
      - store_artifacts:
          path: model/evidence.json
          destination: evidence-snapshot
```

---

## Wrapper Scripts Usage

All platforms can use the provided wrapper scripts for consistency:

### PowerShell (Windows)
```powershell
# Basic execution
.\scripts\sync-evidence.ps1

# With parameters
.\scripts\sync-evidence.ps1 `
  -SourceRepo "C:\eva-foundry\51-ACA" `
  -TargetRepo "C:\eva-foundry\37-data-model" `
  -AutoCommit `
  -Verbose

# Azure Pipeline usage
- task: PowerShell@2
  inputs:
    targetType: 'filePath'
    filePath: '$(System.DefaultWorkingDirectory)/scripts/sync-evidence.ps1'
    arguments: |
      -SourceRepo $(System.DefaultWorkingDirectory)/../51-ACA `
      -TargetRepo $(System.DefaultWorkingDirectory) `
      -AutoCommit
```

### Bash (Linux/macOS)
```bash
# Basic execution
./scripts/sync-evidence.sh

# With parameters
./scripts/sync-evidence.sh \
  --source-repo /path/to/51-ACA \
  --target-repo /path/to/37-data-model \
  --auto-commit \
  --verbose

# GitLab CI usage
script:
  - ./scripts/sync-evidence.sh \
    --source-repo /tmp/51-ACA \
    --target-repo $CI_PROJECT_DIR \
    --auto-commit
```

### Python (Direct)
```python
# Direct execution
python scripts/sync-evidence-from-51-aca.py \
  /path/to/51-ACA \
  /path/to/37-data-model

# With error handling
import subprocess
import sys

result = subprocess.run([
    sys.executable,
    'scripts/sync-evidence-from-51-aca.py',
    source_repo,
    target_repo
], capture_output=True, text=True)

if result.returncode != 0:
    print(f"Error: {result.stderr}", file=sys.stderr)
    sys.exit(1)

print(result.stdout)
```

---

## Monitoring & Alerts

### GitHub Actions
- **Dashboard**: Actions tab in GitHub repo
- **Email**: On workflow failure (configure in GitHub settings)
- **Status Badge**: Add to README
  ```markdown
  ![Evidence Sync](https://github.com/<owner>/<repo>/actions/workflows/sync-51-aca-evidence.yml/badge.svg)
  ```

### Azure Pipelines
- **Dashboard**: Pipelines → Build history
- **Email**: On pipeline completion (configure in pipeline settings)
- **Notifications**: Azure DevOps notification settings

### GitLab
- **Dashboard**: CI/CD → Pipelines
- **Email**: Configure in project settings
- **Slack Integration**: Use GitLab Slack notifications

### Jenkins
- **Dashboard**: Build history on job page
- **Email**: Configure post-build action
- **Slack**: Use Slack plugin

---

## Troubleshooting

### Common Issues

**Issue**: Workflow doesn't trigger on schedule
```bash
# GitHub Actions: Check cron syntax
# Use https://crontab.guru to validate

# Azure Pipelines: Ensure 'always: true' is set
# GitLab: Check scheduled pipeline in UI

# Jenkins: Check cron syntax in job configuration
```

**Issue**: Merge-blocking failures prevent commit
```bash
# This is expected behavior - indicates quality issues
# Check sync-evidence-report.json for details
# Review evidence records with test_result=FAIL or lint_result=FAIL
```

**Issue**: Git authentication fails
```bash
# GitHub Actions: Uses built-in $SECRETS.GITHUB_TOKEN
# Other platforms: Ensure git credentials are configured
# Use GitHub PAT or SSH keys as needed
```

---

## Performance Metrics

**Phase 1 Baseline** (2026-03-03):
- Duration: 1.7 seconds
- Records processed: 63
- Throughput: 37 records/second
- Merge-blocking failures: 0
- Schema validation: 100% pass rate

**Expected Phase 2 Overhead**:
- GitHub Actions setup: ~5 seconds
- Python execution: ~2 seconds
- Git operations: ~3 seconds
- Total: ~10 seconds per run

---

## Next Steps

- [ ] Commit Phase 2 workflow to git
- [ ] Test manual workflow execution
- [ ] Monitor first scheduled run (08:00 UTC)
- [ ] Phase 3: Multi-project scaling
- [ ] Phase 4: Insurance audit integration
- [ ] Discussion agent refactoring (API-first)

---

*Related Documentation*: 
- [`PHASE-1-EVIDENCE-BACKFILL-REPORT.md`](./PHASE-1-EVIDENCE-BACKFILL-REPORT.md)
- [`EVIDENCE-LAYER-EVOLUTION-GAP-ANALYSIS.md`](./EVIDENCE-LAYER-EVOLUTION-GAP-ANALYSIS.md)
- [`.github/workflows/sync-51-aca-evidence.yml`](../.github/workflows/sync-51-aca-evidence.yml)
- [`scripts/sync-evidence-from-51-aca.py`](../scripts/sync-evidence-from-51-aca.py)

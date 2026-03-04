#!/bin/bash
# ============================================================================
# Evidence Layer Sync Wrapper for CI/CD Systems
# 
# Usage:
#   ./scripts/sync-evidence.sh \
#     --source-repo /path/to/51-ACA \
#     --target-repo /path/to/37-data-model \
#     [--auto-commit]
#
# Environments:
#   - Works with GitHub Actions
#   - Works with GitLab CI/CD
#   - Works with Jenkins
#   - Works with CircleCI
#   - Works with local development
# ============================================================================

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_REPO="${SOURCE_REPO:-./../51-ACA}"
TARGET_REPO="${TARGET_REPO:-$PROJECT_ROOT}"
AUTO_COMMIT=false
VERBOSE=false

PYTHON_SCRIPT="$TARGET_REPO/scripts/sync-evidence-from-51-aca.py"
REPORT_FILE="$TARGET_REPO/sync-evidence-report.json"
EVIDENCE_FILE="$TARGET_REPO/model/evidence.json"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# ============================================================================
# FUNCTIONS
# ============================================================================

print_header() {
    echo "========================================================================"
    echo "$1"
    echo "========================================================================"
    echo ""
}

print_stage() {
    echo "[STAGE $1] $2"
}

print_success() {
    echo "✓ $1"
}

print_error() {
    echo "✗ $1" >&2
}

exit_error() {
    print_error "$1"
    exit 1
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --source-repo)
            SOURCE_REPO="$2"
            shift 2
            ;;
        --target-repo)
            TARGET_REPO="$2"
            shift 2
            ;;
        --auto-commit)
            AUTO_COMMIT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Expand relative paths
SOURCE_REPO="$(cd "$SOURCE_REPO" 2>/dev/null && pwd)" || exit_error "Source repo not found: $SOURCE_REPO"
TARGET_REPO="$(cd "$TARGET_REPO" 2>/dev/null && pwd)" || exit_error "Target repo not found: $TARGET_REPO"

# ============================================================================
# HEADER
# ============================================================================

print_header "Evidence Layer Synchronization Wrapper"

echo "Source Repo:  $SOURCE_REPO"
echo "Target Repo:  $TARGET_REPO"
echo "Timestamp:    $TIMESTAMP"
echo "AutoCommit:   $AUTO_COMMIT"
echo ""

# ============================================================================
# VALIDATION
# ============================================================================

print_stage "VALIDATION" "Validating environment..."

[[ -d "$SOURCE_REPO" ]] || exit_error "Source repo not found: $SOURCE_REPO"
[[ -d "$TARGET_REPO" ]] || exit_error "Target repo not found: $TARGET_REPO"
[[ -f "$PYTHON_SCRIPT" ]] || exit_error "Python script not found: $PYTHON_SCRIPT"
command -v python3 >/dev/null 2>&1 || exit_error "Python3 not found in PATH"

print_success "All paths validated"
echo ""

# ============================================================================
# STAGE 1: RUN SYNC
# ============================================================================

print_stage "1" "Running evidence sync..."
echo ""

if [[ "$VERBOSE" == "true" ]]; then
    echo "Command: python3 \"$PYTHON_SCRIPT\" \"$SOURCE_REPO\" \"$TARGET_REPO\""
fi

if ! output=$(python3 "$PYTHON_SCRIPT" "$SOURCE_REPO" "$TARGET_REPO" 2>&1); then
    exit_error "Sync script failed"
fi

echo "$output"
echo ""
print_success "Sync completed successfully"
echo ""

# ============================================================================
# STAGE 2: READ REPORT
# ============================================================================

print_stage "2" "Reading sync report..."

[[ -f "$REPORT_FILE" ]] || exit_error "Report file not created: $REPORT_FILE"

# Parse JSON report (using jq if available, otherwise sed)
if command -v jq >/dev/null 2>&1; then
    status=$(jq -r '.status' "$REPORT_FILE")
    extracted=$(jq -r '.extracted_count' "$REPORT_FILE")
    merged=$(jq -r '.merged_count' "$REPORT_FILE")
    validated=$(jq -r '.validated_count' "$REPORT_FILE")
    errors=$(jq -r '.failure_count' "$REPORT_FILE")
    warnings=$(jq -r '.warning_count' "$REPORT_FILE")
    duration=$(jq -r '.duration_ms' "$REPORT_FILE")
else
    # Fallback: basic sed parsing
    status=$(grep -o '"status":"[^"]*' "$REPORT_FILE" | cut -d'"' -f4)
    extracted=$(grep -o '"extracted_count":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
    merged=$(grep -o '"merged_count":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
    validated=$(grep -o '"validated_count":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
    errors=$(grep -o '"failure_count":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
    warnings=$(grep -o '"warning_count":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
    duration=$(grep -o '"duration_ms":[0-9]*' "$REPORT_FILE" | cut -d':' -f2)
fi

echo "Status:        $status"
echo "Extracted:     $extracted"
echo "Merged:        $merged"
echo "Validated:     $validated"
echo "Errors:        $errors"
echo "Warnings:      $warnings"
echo "Duration:      ${duration}ms"
echo ""

[[ "$status" == "PASS" ]] || echo "⚠ Warning: Sync completed with status: $status"

# ============================================================================
# STAGE 3: CHECK FOR CHANGES
# ============================================================================

print_stage "3" "Checking for changes..."

has_changes=false

if [[ -f "$EVIDENCE_FILE" ]]; then
    if command -v jq >/dev/null 2>&1; then
        record_count=$(jq '.objects | length' "$EVIDENCE_FILE")
        test_failures=$(jq '[.objects[] | select(.validation.test_result == "FAIL")] | length' "$EVIDENCE_FILE")
        lint_failures=$(jq '[.objects[] | select(.validation.lint_result == "FAIL")] | length' "$EVIDENCE_FILE")
    else
        record_count=$(grep -o '"id"' "$EVIDENCE_FILE" | wc -l)
        test_failures=$(grep -c 'test_result.*FAIL' "$EVIDENCE_FILE" || echo "0")
        lint_failures=$(grep -c 'lint_result.*FAIL' "$EVIDENCE_FILE" || echo "0")
    fi
    
    echo "✓ evidence.json contains $record_count records"
    
    if [[ $test_failures -gt 0 ]]; then
        echo "⚠ $test_failures records have test_result=FAIL (merge-blocking)"
    else
        print_success "No test failures (merge-blocking gate PASS)"
    fi
    
    if [[ $lint_failures -gt 0 ]]; then
        echo "⚠ $lint_failures records have lint_result=FAIL (merge-blocking)"
    else
        print_success "No lint failures (merge-blocking gate PASS)"
    fi
    
    if [[ $merged -gt 0 ]]; then
        has_changes=true
    fi
fi

echo ""

# ============================================================================
# STAGE 4: GIT OPERATIONS (Optional)
# ============================================================================

if [[ "$AUTO_COMMIT" == "true" && "$has_changes" == "true" ]]; then
    print_stage "4" "Committing changes to git..."
    
    cd "$TARGET_REPO"
    
    if ! command -v git >/dev/null 2>&1; then
        echo "⚠ Git not found, skipping commit"
    else
        # Check for uncommitted changes
        if git status --porcelain | grep -q .; then
            echo "Changes detected:"
            git status --porcelain | sed 's/^/  /'
            echo ""
            
            # Configure git user
            git config user.name "Evidence Sync Bot" 2>/dev/null || true
            git config user.email "bot@eva-foundry.local" 2>/dev/null || true
            
            # Stage files
            git add model/evidence.json
            git add sync-evidence-report.json 2>/dev/null || true
            
            # Create commit message
            commit_msg="chore: sync evidence from 51-ACA ($merged records)

Automatic sync from 51-ACA/.eva/evidence/ to 37-data-model/model/evidence.json

Synced: $TIMESTAMP
Records: $merged
Validated: $validated"
            
            git commit -m "$commit_msg"
            print_success "Committed changes"
            echo ""
        else
            echo "No changes to commit"
            echo ""
        fi
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================

print_header "Evidence Sync Complete"

echo "✓ Status:      $status"
echo "✓ Records:     $merged"
echo "✓ Duration:    ${duration}ms"
echo "✓ Timestamp:   $TIMESTAMP"
echo ""

if [[ "$has_changes" == "true" ]]; then
    echo "ℹ New evidence records synced and committed (if AutoCommit enabled)"
else
    echo "ℹ No new records to sync"
fi

echo ""
echo "Report: $REPORT_FILE"
echo ""

exit 0

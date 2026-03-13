# PART 1.DO.3: Seed Data Loading for L112-L121
# Purpose: Prepare minimal seed data for each layer (API submission ready)

$evidenceDir = "c:\eva-foundry\37-data-model\evidence"
$docsDir = "c:\eva-foundry\37-data-model\docs\examples"

# Ensuedirectories exist
if (-not (Test-Path $docsDir)) { New-Item -ItemType Directory -Path $docsDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceFile = Join-Path $evidenceDir "PART-1-SEED-LOADING-$timestamp.json"

Write-Host "[INFO] === PART 1.DO.3: Seed Data Loading ===" -ForegroundColor Cyan
Write-Host "[INFO] Preparing seed data for 10 layers (L112-L121)"
Write-Host ""

$results = @{
    timestamp = [datetime]::UtcNow.ToString("o")
    part = 1
    phase = "DO.3-SeedDataLoading"
    seed_files_created = 0
    total_seed_records = 0
    seed_details = @()
    errors = @()
}

# Define seed data for each layer
$seedDataTemplates = @(
    @{
        layer_name = "red_team_test_suites"
        file = "red-team-test-suites-seed.json"
        records = @(
            @{
                id = "suite_prompt_injection_001"
                name = "OWASP LLM Top 10 - Prompt Injection Tests"
                description = "Comprehensive test suite for prompt injection vulnerabilities"
                framework = "OWASP-LLM"
                test_count = 12
                status = "active"
                created_by = "Project-36"
            },
            @{
                id = "suite_pii_leakage_001"
                name = "PII Leakage Detection Tests"
                description = "Tests for personally identifiable information exposure"
                framework = "MITRE-ATLAS"
                test_count = 8
                status = "active"
                created_by = "Project-36"
            }
        )
    },
    @{
        layer_name = "attack_tactic_catalog"
        file = "attack-tactics-master.json"
        records = @(
            @{
                id = "tactic_prompt_injection"
                name = "Prompt Injection"
                framework = "OWASP-LLM"
                owasp_id = "LLM01"
                severity = "critical"
                description = "Direct manipulation of LLM inputs to cause unintended behavior"
            },
            @{
                id = "tactic_pii_leakage"
                name = "Sensitive Information Disclosure"
                framework = "OWASP-LLM"
                owasp_id = "LLM06"
                severity = "high"
                description = "Application or model disclosing sensitive information in responses"
            },
            @{
                id = "tactic_jailbreak"
                name = "Model Jailbreaking"
                framework = "MITRE-ATLAS"
                severity = "high"
                description = "Bypassing safety guidelines through prompt crafting or context manipulation"
            }
        )
    },
    @{
        layer_name = "ai_security_findings"
        file = "ai-security-findings-examples.json"
        records = @(
            @{
                id = "find_001"
                test_id = "suite_prompt_injection_001"
                attack_tactic = "prompt-injection"
                severity = "high"
                finding_type = "vulnerability"
                description = "Model responds to injected instructions that contradict system prompt"
                created_at = [datetime]::UtcNow.ToString("o")
                created_by = "Project-36"
            }
        )
    },
    @{
        layer_name = "assertions_catalog"
        file = "assertions-examples.json"
        records = @(
            @{
                id = "assert_is_bilingual_zh_en"
                assertion_type = "linguistic_analysis"
                name = "Is Bilingual (ZH-EN)"
                description = "Validates that response contains both Chinese and English content"
                implementation = @{
                    language = "python"
                    code = "from langdetect import detect; detect(text) in ['zh', 'en']"
                    dependencies = @("langdetect")
                }
            },
            @{
                id = "assert_no_pii_present"
                assertion_type = "security_check"
                name = "No PII Present"
                description = "Validates that response does not contain sensitive PII"
                implementation = @{
                    language = "python"
                    code = "import re; not re.search(r'(\d{3}-\d{2}-\d{4}|person_id|api_key)', text)"
                    dependencies = @("re")
                }
            },
            @{
                id = "assert_response_latency_threshold"
                assertion_type = "performance_constraint"
                name = "Response Latency Under 2s"
                description = "Validates response time is under 2 seconds"
                implementation = @{
                    language = "python"
                    code = "elapsed_ms < 2000"
                    dependencies = @()
                }
            }
        )
    },
    @{
        layer_name = "ai_security_metrics"
        file = "ai-security-metrics-sample.json"
        records = @(
            @{
                id = "metrics_suite_001_run_20260312"
                suite_id = "suite_prompt_injection_001"
                test_count = 12
                pass_count = 10
                fail_count = 2
                pass_rate = 0.833
                api_cost_usd = 0.15
                duration_seconds = 45
                framework_coverage = @{
                    "OWASP-LLM" = 0.92
                    "MITRE-ATLAS" = 0.88
                }
                created_at = [datetime]::UtcNow.ToString("o")
            }
        )
    },
    @{
        layer_name = "vulnerability_scan_results"
        file = "vulnerability-scan-sample.json"
        records = @(
            @{
                id = "scan_2026_03_12_prod"
                scan_type = "nmap+nessus"
                target_scope = "10.0.0.0/8"
                host_count = 42
                service_count = 156
                scan_start = [datetime]::UtcNow.AddHours(-1).ToString("o")
                scan_end = [datetime]::UtcNow.ToString("o")
                created_by = "eva-ops-scanner"
            }
        )
    },
    @{
        layer_name = "infrastructure_cve_findings"
        file = "cve-findings-sample.json"
        records = @(
            @{
                id = "cve_2024_1234_host_10_0_0_5"
                cve_id = "CVE-2024-1234"
                cvss_score = 8.9
                exploitability_score = 0.97
                affected_host = "10.0.0.5"
                affected_service = "nginx:1.23.1"
                patch_available = $true
                severity = "critical"
            },
            @{
                id = "cve_2024_5678_host_10_0_0_10"
                cve_id = "CVE-2024-5678"
                cvss_score = 7.5
                exploitability_score = 0.85
                affected_host = "10.0.0.10"
                affected_service = "postgresql:13.4"
                patch_available = $true
                severity = "high"
            },
            @{
                id = "cve_2024_9999_host_10_0_0_15"
                cve_id = "CVE-2024-9999"
                cvss_score = 5.2
                exploitability_score = 0.52
                affected_host = "10.0.0.15"
                affected_service = "docker:20.10.5"
                patch_available = $false
                severity = "medium"
            },
            @{
                id = "cve_2023_9876_host_10_0_0_20"
                cve_id = "CVE-2023-9876"
                cvss_score = 6.1
                exploitability_score = 0.68
                affected_host = "10.0.0.20"
                affected_service = "openssl:1.1.1k"
                patch_available = $true
                severity = "high"
            },
            @{
                id = "cve_2024_0001_host_10_0_0_25"
                cve_id = "CVE-2024-0001"
                cvss_score = 9.1
                exploitability_score = 0.99
                affected_host = "10.0.0.25"
                affected_service = "apache2:2.4.41"
                patch_available = $true
                severity = "critical"
            }
        )
    },
    @{
        layer_name = "risk_ranking_analysis"
        file = "risk-ranking-sample.json"
        records = @(
            @{
                id = "pareto_analysis_2026_03_12"
                period_start = [datetime]::UtcNow.AddDays(-7).ToString("o")
                period_end = [datetime]::UtcNow.ToString("o")
                total_findings = 156
                top_20_percent_count = 31
                top_20_percent_risk_pct = 0.80
                pareto_constant = 1.58
                top_findings = @("CVE-2024-1234", "CVE-2024-0001", "CVE-2024-5678")
                risk_reduction_potential_pct = 0.78
            }
        )
    },
    @{
        layer_name = "remediation_tasks"
        file = "remediation-tasks-sample.json"
        records = @(
            @{
                id = "task_remedy_cve_2024_1234"
                cve_id = "CVE-2024-1234"
                severity = "critical"
                assigned_to = "security-team@eva.dev"
                due_date = [datetime]::UtcNow.AddDays(1).ToString("o")
                sla_hours = 24
                remediation_type = "patch"
                status = "open"
            },
            @{
                id = "task_remedy_cve_2024_5678"
                cve_id = "CVE-2024-5678"
                severity = "high"
                assigned_to = "ops-team@eva.dev"
                due_date = [datetime]::UtcNow.AddDays(3).ToString("o")
                sla_hours = 72
                remediation_type = "patch"
                status = "open"
            },
            @{
                id = "task_remedy_cve_2024_9999"
                cve_id = "CVE-2024-9999"
                severity = "medium"
                assigned_to = "ops-team@eva.dev"
                due_date = [datetime]::UtcNow.AddDays(14).ToString("o")
                sla_hours = 336
                remediation_type = "monitor"
                status = "open"
            }
        )
    },
    @{
        layer_name = "remediation_effectiveness_metrics"
        file = "remediation-metrics-sample.json"
        records = @(
            @{
                id = "metrics_week_2026_03_12"
                period_start = [datetime]::UtcNow.AddDays(-7).ToString("o")
                period_end = [datetime]::UtcNow.ToString("o")
                findings_closed = 12
                findings_reopened = 1
                risk_reduction_pct = 0.42
                sla_compliance_pct = 0.93
                avg_remediation_days = 4.2
                velocity_closed_per_day = 1.71
                backlog_size = 44
            }
        )
    }
)

Write-Host "[PREPARE] Creating seed data files..." -ForegroundColor Yellow

foreach ($template in $seedDataTemplates) {
    Write-Host -NoNewline "[SEED] $($template.layer_name) ... "
    
    try {
        $seedFile = Join-Path $docsDir $template.file
        $template.records | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $seedFile
        
        $results.seed_files_created += 1
        $results.total_seed_records += $template.records.Count
        
        $results.seed_details += @{
            layer_name = $template.layer_name
            file = $template.file
            record_count = $template.records.Count
            status = "CREATED"
        }
        
        Write-Host "OK ($($template.records.Count) records)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR" -ForegroundColor Red
        $results.errors += "$($template.layer_name): $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  Seed Files Created: $($results.seed_files_created) / 10"
Write-Host "  Total Seed Records: $($results.total_seed_records)"

if ($results.errors.Count -gt 0) {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    $results.status = "ERROR"
    $results.exit_code = 1
} else {
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    $results.status = "SUCCESS"
    $results.exit_code = 0
}

# Save evidence
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $evidenceFile
Write-Host ""
Write-Host "[EVIDENCE] Saved: $evidenceFile" -ForegroundColor Gray
Write-Host "[SEEDS] Created in: $docsDir" -ForegroundColor Gray

exit $results.exit_code

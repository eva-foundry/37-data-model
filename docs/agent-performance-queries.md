# Agent Performance Query Examples

## Overview

This document provides REST API query patterns to access agent performance data from L44-L47.

**Endpoint Base**: `https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io`

---

## Query Pattern 1: Get Agent Overall Metrics

**Use Case**: Dashboard widget showing agent health snapshot

```powershell
# Get overall metrics for an agent
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_performance_metrics/?agent_id=system:iac-deployer" `
  -Method GET

$agent = $response.data[0]
Write-Host "Agent: $($agent.agent_name)"
Write-Host "Reliability: $($agent.performance_ranking.reliability_score_0_to_100)%"
Write-Host "Speed: $($agent.performance_ranking.speed_score_0_to_100)%"
Write-Host "Cost Efficiency: $($agent.performance_ranking.cost_efficiency_score_0_to_100)%"
Write-Host "Safety: $($agent.performance_ranking.safety_score_0_to_100)%"
Write-Host "Overall Score: $($agent.performance_ranking.overall_agent_score_0_to_100)%"
```

**Response Structure**:
```json
{
  "data": [{
    "agent_id": "system:iac-deployer",
    "metrics": {
      "deployments_total": 15,
      "success_rate_percent": 93.33,
      "avg_quality_score": 91
    },
    "performance_ranking": {
      "reliability_score_0_to_100": 93,
      "speed_score_0_to_100": 82,
      "cost_efficiency_score_0_to_100": 87,
      "safety_score_0_to_100": 100,
      "overall_agent_score_0_to_100": 91
    }
  }]
}
```

---

## Query Pattern 2: Get Deployment Quality Scores

**Use Case**: Review quality of recent deployments

```powershell
# Get quality scores for all deployments in past 7 days
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/deployment_quality_scores/?limit=10" `
  -Method GET

foreach ($score in $response.data) {
  Write-Host "Deployment: $($score.deployment_id)"
  Write-Host "  Quality Score: $($score.overall_quality_score) ($($score.quality_grade))"
  Write-Host "  Environment: $($score.environment)"
  Write-Host "  Agent: $($score.agent_id)"
  Write-Host ""
}
```

**Filter by Environment**:
```powershell
# Get only prod deployment quality scores
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/deployment_quality_scores/?environment=prod&limit=5" `
  -Method GET
```

**Filter by Quality Grade**:
```powershell
# Find all deployments with grade A or better
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/deployment_quality_scores/" `
  -Method GET

$excellentDeployments = $response.data | Where-Object { $_.overall_quality_score -ge 95 }
Write-Host "Excellent deployments (A+): $($excellentDeployments.Count)"
```

---

## Query Pattern 3: Get Agent Execution History

**Use Case**: Audit trail and compliance verification

```powershell
# Get all deployments by an agent
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_execution_history/?agent_id=system:validator" `
  -Method GET

$deployments = $response.data | Where-Object { $_.action_type -eq "deploy" }
Write-Host "Total deployments by system:validator: $($deployments.Count)"

foreach ($deployment in $deployments | Select-Object -Last 5) {
  Write-Host "  - $($deployment.timestamp): $($deployment.outcome) ($($deployment.duration_ms)ms)"
}
```

**Get Rollback Events**:
```powershell
# Find all auto-rollbacks
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_execution_history/?action_type=rollback" `
  -Method GET

Write-Host "Auto-rollback events in history: $($response.data.Count)"
foreach ($event in $response.data) {
  Write-Host "  - $($event.timestamp): $($event.agent_id)"
}
```

**Get Policy Denials**:
```powershell
# Find all policy violations
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_execution_history/?action_type=query_policy&outcome=denied" `
  -Method GET

Write-Host "Policy denials: $($response.data.Count)"
```

---

## Query Pattern 4: Get Performance Trends

**Use Case**: Trending and forecasting

```powershell
# Get weekly trends for an agent
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/performance_trends/?agent_id=system:validator&metric_period=weekly" `
  -Method GET

$trend = $response.data[0]
Write-Host "Agent: $($trend.agent_name)"
Write-Host "Period: $($trend.period_start) to $($trend.period_end)"
Write-Host "Success Rate: $($trend.metrics_snapshot.success_rate_percent)%"
Write-Host "Reliability Trend: $($trend.trend_indicators.reliability_trend)"
Write-Host "Rank: #$($trend.peer_comparison.rank_by_reliability) (vs peers)"
```

**Compare All Agents (Peer Comparison)**:
```powershell
# Get all trends to build comparison table
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/performance_trends/?metric_period=weekly&limit=20" `
  -Method GET

$table = $response.data | Select-Object @(
  @{ N="Agent"; E={ $_.agent_name }},
  @{ N="Reliability"; E={ "$($_.metrics_snapshot.success_rate_percent)%" }},
  @{ N="Rank"; E={ "#$($_.peer_comparison.rank_by_reliability)" }},
  @{ N="Trend"; E={ $_.trend_indicators.reliability_trend }},
  @{ N="Cost"; E={ "`$$($_.metrics_snapshot.avg_cost_per_deployment_usd)" }}
)

$table | Format-Table -AutoSize
```

**Identify Declining Performance**:
```powershell
# Find agents with declining trends
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/performance_trends/?metric_period=weekly" `
  -Method GET

$declining = $response.data | Where-Object {
  $_.trend_indicators.reliability_trend -eq "declining" -or
  $_.trend_indicators.safety_trend -eq "declining"
}

Write-Host "Agents with declining metrics: $($declining.Count)"
foreach ($agent in $declining) {
  Write-Host "  - $($agent.agent_name): $($agent.trend_indicators.reliability_trend)"
}
```

---

## Query Pattern 5: Cross-Layer Analysis

**Use Case**: Deep dive investigation

```powershell
# Find root cause of deployment failure
$deploymentId = "deploy-20260304-110000-staging"

# Step 1: Get quality score
$quality = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/deployment_quality_scores/?deployment_id=$deploymentId" | Select-Object -First 1

Write-Host "Quality Score: $($quality.overall_quality_score)"
Write-Host "Issues:"
foreach ($issue in $quality.issues) {
  Write-Host "  - $issue"
}

# Step 2: Get execution history
$execution = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_execution_history/?deployment_id=$deploymentId" | Select-Object -First 1

Write-Host "Agent: $($execution.agent_id)"
Write-Host "Duration: $($execution.duration_ms)ms"
if ($execution.error_log.Count -gt 0) {
  Write-Host "Errors:"
  foreach ($error in $execution.error_log) {
    Write-Host "  - $error"
  }
}
```

---

## Query Pattern 6: Real-Time Monitoring

**Use Case**: Production monitoring dashboard

```powershell
# Get agent status for on-call dashboard
$response = Invoke-RestMethod -Uri `
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_performance_metrics/?status=active" `
  -Method GET

Write-Host "╔════════════════════════════════════════════░"
Write-Host "║  AGENT STATUS DASHBOARD"
Write-Host "╠════════════════════════════════════════════"

foreach ($agent in $response.data) {
  $status = switch ($agent.performance_ranking.overall_agent_score_0_to_100) {
    { $_ -ge 90 } { "🟢" }
    { $_ -ge 80 } { "🟡" }
    default { "🔴" }
  }
  
  Write-Host "║ $status  $($agent.agent_name)"
  Write-Host "║    Reliability: $($agent.performance_ranking.reliability_score_0_to_100)% | Safety: $($agent.performance_ranking.safety_score_0_to_100)% "
  Write-Host "║    Deployments: $($agent.metrics.deployments_total) | Success: $($agent.metrics.success_rate_percent)%"
}

Write-Host "╚════════════════════════════════════════════"
```

---

## Pagination & Performance

**Large Result Sets**:
```powershell
# Query with pagination for large datasets
$limit = 10
$offset = 0
$allRecords = @()

do {
  $response = Invoke-RestMethod -Uri `
    "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_execution_history/?limit=$limit&offset=$offset" `
    -Method GET
  
  $allRecords += $response.data
  break  # API returns full result; no need to paginate
} while ($response.data.Count -eq $limit)

Write-Host "Total records: $($allRecords.Count)"
```

---

## SDK Integration Examples

### PowerShell Module

```powershell
# Load helper module (future)
Import-Module ./agents-performance-module.psm1

# Get agent summary
$summary = Get-AgentSummary -AgentId "system:validator"
$summary | Format-List

# Find agents needing attention
$atRisk = Get-AgentsAtRisk -ThresholdScore 75
$atRisk | Sort-Object -Property OverallScore | Format-Table
```

### Python SDK (Future)

```python
from eva_data_model import AgentPerformance

# Initialize
perf = AgentPerformance("https://msub-eva-data-model...")

# Get agent metrics
agent = perf.get_agent("system:validator")
print(f"Overall Score: {agent.performance_score}")

# Find top performers
top_agents = perf.get_top_agents(limit=5, by="reliability")
for agent in top_agents:
    print(f"{agent.name}: {agent.reliability}%")

# Trend analysis
trends = perf.get_trends(agent_id="system:iac-deployer", period="weekly")
print(trends.reliability_trend)  # "improving", "stable", or "declining"
```

---

## Reference: Layer Endpoints

| Layer | Purpose | Key Endpoint |
|-------|---------|--------------|
| L44 | Agent Performance Metrics | `/model/agent_performance_metrics` |
| L45 | Deployment Quality Scores | `/model/deployment_quality_scores` |
| L46 | Agent Execution History | `/model/agent_execution_history` |
| L47 | Performance Trends | `/model/performance_trends` |

---

End of Query Examples

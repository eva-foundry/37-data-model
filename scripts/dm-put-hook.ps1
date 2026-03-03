$base = 'https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io'

$hook = [PSCustomObject]@{
    id               = 'useActingSession'
    label            = 'useActingSession'
    repo_path        = '31-eva-faces/admin-face/src/hooks/useActingSession.ts'
    repo_line        = 36
    service          = 'admin-face'
    calls_endpoints  = @('POST /v1/roles/acting-as')
    returns          = @('{ sessionReady: boolean; sessionId: string; personaId: string; features: string[] }')
    used_by_screens  = @('AdminFaceApp')
    data_type        = 'ActingSession'
    status           = 'implemented'
    is_active        = $true
    description      = 'Bootstraps H1 handshake on mount: POST /v1/roles/acting-as with X-Actor-OID header. Falls back to DEV_BYPASS mode on error. Persists session to sessionStorage.'
}

$json = $hook | ConvertTo-Json -Depth 10
Write-Host "JSON body:"
Write-Host $json
Write-Host ""

Write-Host "Sending PUT to $base/model/hooks/useActingSession ..."
$resp = Invoke-RestMethod "$base/model/hooks/useActingSession" `
    -Method PUT `
    -ContentType 'application/json' `
    -Body $json `
    -Headers @{ 'X-Actor' = 'agent:copilot' }

Write-Host ""
Write-Host "PUT result:"
Write-Host "  id           = $($resp.id)"
Write-Host "  row_version  = $($resp.row_version)"
Write-Host "  status       = $($resp.status)"
Write-Host "  modified_by  = $($resp.modified_by)"
Write-Host "PUT_COMPLETE"

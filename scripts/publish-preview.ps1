param([switch]$Publish,[string]$OriginCert = "$env:USERPROFILE\.cloudflared\cert-tangvu.pem")
$ErrorActionPreference = 'Stop'
if (-not $Publish) { throw 'Public deployment requires explicit authorization. After approval, pass -Publish.' }
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoPath
if (-not (Test-Path -LiteralPath $OriginCert)) { throw 'Configured tangvu.dev origin certificate is unavailable.' }
$previewHealth = Invoke-RestMethod 'http://127.0.0.1:4382/healthz'
if ($previewHealth.mode -ne 'recorded-simulator-preview' -or $previewHealth.writes -ne $false) { throw 'Unexpected origin: refusing to publish.' }
$cloudflaredPath = (Get-Command cloudflared -ErrorAction Stop).Source
$credentialPath = Join-Path $repoPath '.runtime\statebound-tunnel.json'
$configPath = Join-Path $repoPath '.runtime\statebound-tunnel.yml'
$tunnels = & $cloudflaredPath tunnel --origincert $OriginCert list --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Could not list tunnels.' }
$existingTunnel = @($tunnels | Where-Object { $_.name -eq 'statebound-demo' })
if ($existingTunnel.Count -gt 1) { throw 'Ambiguous tunnel name.' }
if ($existingTunnel.Count -eq 0) {
  & $cloudflaredPath tunnel --origincert $OriginCert create --credentials-file $credentialPath statebound-demo
  if ($LASTEXITCODE -ne 0) { throw 'Tunnel creation failed.' }
}
if (-not (Test-Path -LiteralPath $credentialPath)) { throw 'Existing tunnel has no repository-scoped credential. Refusing to change it.' }
# Read only the tunnel ID into configuration; never print the tunnel secret.
$tunnelId = (Get-Content -LiteralPath $credentialPath -Raw | ConvertFrom-Json).TunnelID
if ($tunnelId -notmatch '^[0-9a-f-]{36}$') { throw 'Invalid tunnel ID.' }
if ($existingTunnel.Count -eq 1 -and $existingTunnel[0].id -ne $tunnelId) { throw 'Credential does not match the named tunnel.' }
$quotedCredential = ConvertTo-Json $credentialPath -Compress
@"
tunnel: $tunnelId
credentials-file: $quotedCredential
metrics: 127.0.0.1:0
ingress:
  - hostname: statebound.tangvu.dev
    service: http://127.0.0.1:4382
  - service: http_status:404
"@ | Set-Content -LiteralPath $configPath -Encoding utf8
& $cloudflaredPath tunnel --config $configPath ingress validate
if ($LASTEXITCODE -ne 0) { throw 'Ingress validation failed.' }
# No overwrite flag: an existing conflicting DNS record is a hard stop.
& $cloudflaredPath tunnel --origincert $OriginCert route dns $tunnelId statebound.tangvu.dev
if ($LASTEXITCODE -ne 0) { throw 'DNS route failed. No existing record was overwritten.' }
$pm2Config = @{ apps = @(@{
  name = 'statebound-tunnel'; namespace = 'statebound'; cwd = $repoPath
  script = $cloudflaredPath; interpreter = 'none'
  args = @('tunnel','--config',$configPath,'--no-autoupdate','run',$tunnelId)
  autorestart = $true; restart_delay = 3000; max_restarts = 10
  out_file = '.runtime/tunnel-out.log'; error_file = '.runtime/tunnel-error.log'; time = $true
}) }
$pm2ConfigPath = Join-Path $repoPath '.runtime\statebound-tunnel.config.json'
$pm2Config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $pm2ConfigPath -Encoding utf8
pm2 start $pm2ConfigPath --only statebound-tunnel
if ($LASTEXITCODE -ne 0) { throw 'Tunnel process failed to start.' }
pm2 save
if ($LASTEXITCODE -ne 0) { throw 'PM2 process persistence failed.' }
Write-Output 'Tunnel started. Verify https://statebound.tangvu.dev/healthz and actual video playback before claiming public availability.'

param([ValidateSet('tts','asr')][string]$Operation,[ValidatePattern('^[a-z]+$')][string]$Scene)
$ErrorActionPreference = 'Stop'
$mimoCredentialPath = Join-Path $PSScriptRoot '../.runtime/mimo/credential.dpapi'
$mimoSecure = (Get-Content -LiteralPath $mimoCredentialPath -Raw).Trim() | ConvertTo-SecureString
$mimoPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mimoSecure)
try {
  $env:MIMO_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($mimoPointer)
  node (Join-Path $PSScriptRoot 'mimo-voice.mjs') $Operation $Scene
  $mimoExit = $LASTEXITCODE
} finally {
  Remove-Item Env:MIMO_API_KEY -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($mimoPointer)
}
exit $mimoExit

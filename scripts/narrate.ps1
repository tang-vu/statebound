$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$stateboundScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../submission/scenes.json') -Raw | ConvertFrom-Json
$stateboundOutput = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.runtime/narration'))
New-Item -ItemType Directory -Force -Path $stateboundOutput | Out-Null
$stateboundSpeaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $stateboundSpeaker.SelectVoice('Microsoft Zira Desktop')
  $stateboundSpeaker.Rate = 0
  foreach ($stateboundScene in $stateboundScenes) {
    $stateboundWave = Join-Path $stateboundOutput ($stateboundScene.id + '.wav')
    $stateboundSpeaker.SetOutputToWaveFile($stateboundWave)
    $stateboundSpeaker.Speak($stateboundScene.text)
    $stateboundSpeaker.SetOutputToNull()
    Write-Output ('Narrated ' + $stateboundScene.id)
  }
} finally { $stateboundSpeaker.Dispose() }

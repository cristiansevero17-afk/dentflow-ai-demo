param(
  [string]$Message = "Deploy update",
  [switch]$SkipGit,
  [switch]$HooksOnly
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

function Get-GitCommand {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git) { return $git.Source }

  $githubDesktopGit = Join-Path $env:LOCALAPPDATA "GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe"
  if (Test-Path $githubDesktopGit) { return $githubDesktopGit }

  throw "Git was not found. Install Git or GitHub Desktop."
}

function Invoke-DeployHook {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [AllowEmptyString()][string]$Url
  )

  if ([string]::IsNullOrWhiteSpace($Url)) {
    Write-Host "$Name hook not configured. Skipping."
    return
  }

  Write-Host "Triggering $Name deploy..."
  Invoke-RestMethod -Uri $Url -Method Post -TimeoutSec 60 | Out-Null
  Write-Host "$Name deploy triggered."
}

if (-not $SkipGit -and -not $HooksOnly) {
  $git = Get-GitCommand
  & $git add -A
  $status = & $git status --short

  if ($status) {
    & $git commit -m $Message
    & $git push
  }
  else {
    Write-Host "No local changes to commit."
  }
}

Invoke-DeployHook -Name "Render" -Url $env:RENDER_DEPLOY_HOOK_URL
Invoke-DeployHook -Name "Vercel" -Url $env:VERCEL_DEPLOY_HOOK_URL

Write-Host "Deploy command completed."

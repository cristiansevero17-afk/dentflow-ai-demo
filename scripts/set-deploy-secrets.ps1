function Set-SecretUserEnv {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Prompt
  )

  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }

  if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Host "Skipped $Name"
    return
  }

  [Environment]::SetEnvironmentVariable($Name, $plain.Trim(), "User")
  Set-Item -Path "Env:$Name" -Value $plain.Trim()
  Write-Host "Saved $Name in Windows user environment variables."
}

Write-Host "Paste deploy hook URLs. The input will be hidden."
Write-Host "Leave a value empty to skip it."

Set-SecretUserEnv -Name "RENDER_DEPLOY_HOOK_URL" -Prompt "Render deploy hook URL"
Set-SecretUserEnv -Name "VERCEL_DEPLOY_HOOK_URL" -Prompt "Vercel deploy hook URL"

Write-Host ""
Write-Host "Done. Open a new terminal before running scripts/deploy.ps1 so Windows reloads the saved variables."

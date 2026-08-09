param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("check", "migrate")]
  [string]$Mode
)

$ErrorActionPreference = "Stop"

function Assert-ProjectAdminOwnership {
  & npx.cmd -y '@insforge/cli' db query $env:APPLYFIT_OWNERSHIP_GUARD_SQL --json
  if ($LASTEXITCODE -ne 0) {
    throw "ApplyFit requires project_admin ownership for every public application table and enum."
  }
}

function Test-DatabaseOwnership {
  Assert-ProjectAdminOwnership
  Write-Output "Database application tables and enums are owned by project_admin."
}

Test-DatabaseOwnership

if ($Mode -eq "migrate") {
  & npx.cmd -y '@insforge/cli' db migrations up --all
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  Test-DatabaseOwnership
}

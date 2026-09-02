$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Push-Location $repositoryRoot
try {
  $requiredFiles = @(
    'package.json',
    'backend/database/schema.sql',
    'backend/src/database.js',
    'backend/src/overview-summary.js',
    'backend/src/server.js',
    'backend/test/overview-summary.test.js'
  )

  foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
      throw "Missing required backend file: $requiredFile"
    }
  }

  node --check backend/src/server.js
  node --check backend/src/overview-summary.js
  npm.cmd run test
  Write-Output 'Backend validation passed.'
} finally {
  Pop-Location
}

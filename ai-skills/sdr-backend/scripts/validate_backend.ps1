$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Push-Location $repositoryRoot
try {
  $requiredFiles = @(
    'package.json',
    'backend/database/schema.sql',
    'backend/src/database.js',
    'backend/src/gateway-ingestion.js',
    'backend/src/overview-summary.js',
    'backend/src/devices-to-watch.js',
    'backend/src/device-list.js',
    'backend/test/device-list.test.js',
    'backend/src/recent-alerts.js',
    'backend/src/system-performance.js',
    'backend/src/server.js',
    'backend/src/gateway-status.js',
    'backend/src/simulator-jobs.js',
    'backend/simulator/simulator-inventory.js',
    'backend/simulator/console-devices.js',
    'backend/simulator/console-jobs.js',
    'backend/test/simulator-inventory.test.js',
    'backend/test/simulator-jobs.test.js',
    'backend/src/preview-auth.js',
    'backend/scripts/hosted-preview.js',
    'backend/test/hosted-preview.test.js',
    'backend/test/preview-auth.test.js',
    'backend/test/overview-summary.test.js',
    'backend/test/devices-to-watch.test.js',
    'backend/test/recent-alerts.test.js',
    'backend/test/gateway-ingestion.test.js',
    'backend/test/device-simulator.test.js',
    'backend/simulator/simulator-config.js',
    'backend/simulator/simulator-runtime.js',
    'backend/test/system-performance.test.js'
  )

  foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
      throw "Missing required backend file: $requiredFile"
    }
  }

  node --check backend/src/gateway-status.js
  node --check backend/src/simulator-jobs.js
  node --check backend/simulator/simulator-inventory.js
  node --check backend/simulator/console-devices.js
  node --check backend/simulator/console-jobs.js
  node --check backend/src/server.js
  node --check backend/src/preview-auth.js
  node --check backend/scripts/hosted-preview.js
  node --check backend/src/gateway-ingestion.js
  node --check backend/simulator/device-simulator.js
  node --check backend/simulator/simulator-config.js
  node --check backend/simulator/simulator-runtime.js
  node --check backend/src/overview-summary.js
  node --check backend/src/devices-to-watch.js
  node --check backend/src/device-list.js
  node --check backend/src/recent-alerts.js
  node --check backend/src/system-performance.js
  npm.cmd run test
  Write-Output 'Backend validation passed.'
} finally {
  Pop-Location
}

[CmdletBinding()]
param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$runner = Join-Path $projectRoot "scripts\dev-service.ps1"
$logsDir = Join-Path $projectRoot "logs"

$pythonCandidates = @(
    (Join-Path $backendDir ".venv\Scripts\python.exe"),
    (Join-Path $backendDir "venv\Scripts\python.exe")
)
if (-not ($pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)) {
    throw "No backend virtual environment found. Expected backend\.venv or backend\venv."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm.cmd was not found on PATH. Install Node.js and reopen PowerShell."
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendDir "node_modules"))) {
    throw "Frontend dependencies are missing. Run 'npm install' inside frontend first."
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
$powershellExe = (Get-Process -Id $PID).Path
$services = @()

function Start-DevService {
    param([string]$Name, [int]$Port)
    $arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $runner, "-Service", $Name, "-ProjectRoot", $projectRoot, "-Port", "$Port")
    return Start-Process -FilePath $powershellExe -ArgumentList $arguments -PassThru -WindowStyle Hidden
}

try {
    $services += [pscustomobject]@{ Name = "backend"; Process = (Start-DevService -Name "backend" -Port $BackendPort); Log = (Join-Path $logsDir "backend.log") }
    $services += [pscustomobject]@{ Name = "frontend"; Process = (Start-DevService -Name "frontend" -Port $FrontendPort); Log = (Join-Path $logsDir "frontend.log") }

    Write-Host "CocktailClips is starting." -ForegroundColor Green
    Write-Host "Frontend: http://localhost:$FrontendPort"
    Write-Host "Backend:  http://localhost:$BackendPort"
    Write-Host "Backend log:  $($services[0].Log)"
    Write-Host "Frontend log: $($services[1].Log)"
    Write-Host "Press Ctrl+C to stop both services."

    Start-Sleep -Seconds 2
    while ($true) {
        foreach ($service in $services) {
            if ($service.Process.HasExited) {
                throw "$($service.Name) stopped with exit code $($service.Process.ExitCode). Check $($service.Log)"
            }
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    foreach ($service in $services) {
        if (-not $service.Process.HasExited) {
            try { $service.Process.Kill($true) } catch { $service.Process.Kill() }
            [void]$service.Process.WaitForExit(5000)
        }
        $service.Process.Dispose()
    }
    Write-Host "Backend and frontend stopped." -ForegroundColor Yellow
}

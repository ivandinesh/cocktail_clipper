param(
    [Parameter(Mandatory)] [ValidateSet("backend", "frontend")] [string]$Service,
    [Parameter(Mandatory)] [string]$ProjectRoot,
    [Parameter(Mandatory)] [int]$Port
)

$ErrorActionPreference = "Stop"
$logsDir = Join-Path $ProjectRoot "logs"
$logPath = Join-Path $logsDir "$Service.log"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

"[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Starting $Service on port $Port" | Set-Content -LiteralPath $logPath -Encoding Unicode

try {
    if ($Service -eq "backend") {
        $backendDir = Join-Path $ProjectRoot "backend"
        $pythonCandidates = @((Join-Path $backendDir ".venv\Scripts\python.exe"), (Join-Path $backendDir "venv\Scripts\python.exe"))
        $pythonExe = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

        if (-not (Get-Command ffmpeg.exe -ErrorAction SilentlyContinue)) {
            $wingetPackages = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
            if (Test-Path -LiteralPath $wingetPackages) {
                $ffmpegFile = Get-ChildItem -LiteralPath $wingetPackages -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($ffmpegFile) { $env:Path = "$($ffmpegFile.DirectoryName);$env:Path" }
            }
        }
        if (-not (Get-Command ffmpeg.exe -ErrorAction SilentlyContinue)) {
            "[$([DateTime]::Now.ToString('HH:mm:ss'))] WARNING FFmpeg was not found; cutting and rendering will fail." | Out-File -LiteralPath $logPath -Append -Encoding Unicode
        }
        Set-Location -LiteralPath $backendDir
        $ErrorActionPreference = "Continue"
        & $pythonExe -m uvicorn app.main:app --reload --port $Port 2>&1 | ForEach-Object { $_.ToString() } | Out-File -LiteralPath $logPath -Append -Encoding Unicode
    } else {
        Set-Location -LiteralPath (Join-Path $ProjectRoot "frontend")
        $ErrorActionPreference = "Continue"
        & npm.cmd run dev -- --host 127.0.0.1 --port $Port 2>&1 | ForEach-Object { $_.ToString() } | Out-File -LiteralPath $logPath -Append -Encoding Unicode
    }
} catch {
    "[$([DateTime]::Now.ToString('HH:mm:ss'))] ERROR $($_.Exception.Message)" | Out-File -LiteralPath $logPath -Append -Encoding Unicode
    exit 1
} finally {
    "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Stopped $Service" | Out-File -LiteralPath $logPath -Append -Encoding Unicode
}

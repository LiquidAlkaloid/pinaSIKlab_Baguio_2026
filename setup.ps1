# MYRACLE setup for Windows: checks for Node.js, installs it if it is missing or too old,
# then installs the project's packages. Easiest way to run it: double-click setup.cmd.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # the progress bar makes downloads much slower
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$NeedMajor = 22                  # @sveltejs/kit 3 needs Node 22.17 or newer
$NeedMinor = 17
$NodeDist = 'https://nodejs.org/dist/latest-v24.x'   # the Node.js LTS line we install

Set-Location $PSScriptRoot

function Say($text) { Write-Host "`n$text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "`n$text" -ForegroundColor Red; exit 1 }

function Get-NodeVersion {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
    try { return [version](& node -p 'process.versions.node') } catch { return $null }
}

function Test-NodeOk {
    $v = Get-NodeVersion
    return $v -and ($v.Major -gt $NeedMajor -or ($v.Major -eq $NeedMajor -and $v.Minor -ge $NeedMinor))
}

$NodeDir = Join-Path $env:ProgramFiles 'nodejs'   # where both winget and the .msi put Node.js

function Get-SavedPath {
    [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

# Pick up PATH changes from the installer without opening a new window. The new Node.js goes
# first, so an older one (for example from nvm-windows) cannot hide it in this window.
function Update-Path {
    $env:Path = "$NodeDir;" + (Get-SavedPath)
}

# The node.exe a NEW window would find first, from the saved PATH.
function Get-NodeInNewWindow {
    foreach ($dir in (Get-SavedPath) -split ';') {
        if ($dir -and (Test-Path (Join-Path $dir 'node.exe'))) { return (Join-Path $dir 'node.exe') }
    }
    return $null
}

function Install-NodeWithMsi {
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $tmp = Join-Path $env:TEMP 'myracle-node'
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null

    $sumsFile = Join-Path $tmp 'SHASUMS256.txt'
    try {
        Invoke-WebRequest "$NodeDist/SHASUMS256.txt" -OutFile $sumsFile -UseBasicParsing
    } catch {
        Fail 'Could not reach nodejs.org. Check your internet connection and try again.'
    }
    $line = Get-Content $sumsFile | Where-Object { $_ -match "node-v[\d.]+-$arch\.msi$" } | Select-Object -First 1
    if (-not $line) { Fail 'Could not find the Node.js installer on nodejs.org.' }
    $hash, $msi = $line.Trim() -split '\s+'
    $file = Join-Path $tmp $msi

    Say "Downloading $msi ..."
    Invoke-WebRequest "$NodeDist/$msi" -OutFile $file -UseBasicParsing

    # Make sure the download is exactly the file nodejs.org published.
    if ((Get-FileHash $file -Algorithm SHA256).Hash -ne $hash.ToUpper()) {
        Fail 'The download did not match its checksum. Run the script again.'
    }

    Say 'Installing Node.js. Windows will ask for permission: click Yes.'
    try {
        $p = Start-Process msiexec.exe -ArgumentList '/i', "`"$file`"", '/passive', '/norestart' -Verb RunAs -Wait -PassThru
    } catch {
        Fail 'Node.js was not installed because Windows permission was not given. Run setup.cmd again and click Yes. On a school or work PC, ask IT to install Node.js 24 LTS.'
    }
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
    if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) { Fail "The Node.js installer stopped with code $($p.ExitCode)." }
}

Say 'Checking for Node.js ...'
if (Test-NodeOk) {
    Write-Host "Found Node.js $(& node -v). Good."
} else {
    $old = Get-NodeVersion
    if ($old) { Write-Host "Found Node.js $old, but MYRACLE needs $NeedMajor.$NeedMinor or newer." }
    else { Write-Host 'Node.js is not installed.' }

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Say 'Installing Node.js LTS with winget ...'
        & winget install --id OpenJS.NodeJS.LTS --exact --silent --accept-source-agreements --accept-package-agreements
        Update-Path
    }
    if (-not (Test-NodeOk)) {
        Install-NodeWithMsi
        Update-Path
    }
    if (-not (Test-NodeOk)) {
        Fail 'Node.js was installed but this window cannot see it yet. Close this window and run setup.cmd again.'
    }
    Write-Host "Installed Node.js $(& node -v)."

    # An older Node.js earlier on the PATH would still win in new windows, and `npm run dev` would fail.
    $first = Get-NodeInNewWindow
    if ($first -and ($first -ne (Join-Path $NodeDir 'node.exe'))) {
        Write-Host "`nHeads up: new windows will still use the older Node.js at $first." -ForegroundColor Yellow
        Write-Host 'If it came from nvm-windows, run: nvm install 24 then nvm use 24. Otherwise uninstall it in Settings > Apps.' -ForegroundColor Yellow
        Write-Host 'This window already uses the new one.' -ForegroundColor Yellow
    }
}

Say "Installing the project's packages ..."
# npm ci installs exactly what package-lock.json lists, so everyone gets the same versions.
# npm.cmd, not npm: PowerShell may block npm.ps1 under the default execution policy.
& npm.cmd ci
if ($LASTEXITCODE -ne 0) { Fail 'Installing packages failed. Read the messages above, or ask in the team chat.' }

Say 'All set. To start MYRACLE any time, open a terminal in this folder and run:  npm run dev'

$answer = Read-Host 'Start it now? [Y/n]'
if ($answer -eq '' -or $answer -match '^[Yy]') { & npm.cmd run dev -- --open }

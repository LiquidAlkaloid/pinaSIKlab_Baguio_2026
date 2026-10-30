# MYRACLE setup for Windows: checks for Node.js, installs it if it is missing or too old,
# then installs the project's packages. Easiest way to run it: double-click setup.cmd.
# Node.js is installed for this user only, in %LOCALAPPDATA%\myracle\node, so no admin
# rights or permission prompt are needed.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # the progress bar makes downloads much slower
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$NeedMajor = 22                  # @sveltejs/kit 3 needs Node 22.17 or newer
$NeedMinor = 17
$NodeDist = 'https://nodejs.org/dist/latest-v24.x'   # the Node.js LTS line we install
$NodeHome = Join-Path $env:LOCALAPPDATA 'myracle\node'

Set-Location $PSScriptRoot

function Say($text) { Write-Host "`n$text" -ForegroundColor Cyan }
function Warn($text) { Write-Host $text -ForegroundColor Yellow }
function Fail($text) { Write-Host "`n$text" -ForegroundColor Red; exit 1 }

function Get-NodeVersion {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
    try { return [version](& node -p 'process.versions.node') } catch { return $null }
}

function Test-NodeOk {
    $v = Get-NodeVersion
    return $v -and ($v.Major -gt $NeedMajor -or ($v.Major -eq $NeedMajor -and $v.Minor -ge $NeedMinor))
}

# The node.exe a NEW window would find first: Windows reads the machine PATH, then the user PATH.
function Get-NodeInNewWindow {
    $saved = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    foreach ($dir in $saved -split ';') {
        if ($dir -and (Test-Path (Join-Path $dir 'node.exe'))) { return (Join-Path $dir 'node.exe') }
    }
    return $null
}

# Put Node.js on this user's PATH. Writing the registry value directly keeps entries like
# %USERPROFILE%\... working; touching a dummy variable afterwards tells Windows to reload it.
function Add-ToUserPath($dir) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
    $raw = [string]$key.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
    if (($raw -split ';') -notcontains $dir) {
        $key.SetValue('Path', ("$dir;$raw").TrimEnd(';'), 'ExpandString')
    }
    $key.Close()
    [Environment]::SetEnvironmentVariable('MYRACLE_SETUP', '1', 'User')
    [Environment]::SetEnvironmentVariable('MYRACLE_SETUP', $null, 'User')
}

function Install-NodeForUser {
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $tmp = Join-Path $env:TEMP 'myracle-node'
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null

    $sumsFile = Join-Path $tmp 'SHASUMS256.txt'
    try {
        Invoke-WebRequest "$NodeDist/SHASUMS256.txt" -OutFile $sumsFile -UseBasicParsing
    } catch {
        Fail 'Could not reach nodejs.org. Check your internet connection and try again.'
    }
    $line = Get-Content $sumsFile | Where-Object { $_ -match "node-v[\d.]+-win-$arch\.zip$" } | Select-Object -First 1
    if (-not $line) { Fail 'Could not find Node.js for Windows on nodejs.org.' }
    $hash, $zip = $line.Trim() -split '\s+'
    $file = Join-Path $tmp $zip

    Say "Downloading $zip ..."
    Invoke-WebRequest "$NodeDist/$zip" -OutFile $file -UseBasicParsing

    # Make sure the download is exactly the file nodejs.org published.
    if ((Get-FileHash $file -Algorithm SHA256).Hash -ne $hash) {
        Fail 'The download did not match its checksum. Run the script again.'
    }

    Say "Installing Node.js in $NodeHome (just for you, no admin needed) ..."
    Expand-Archive $file -DestinationPath $tmp -Force
    New-Item -ItemType Directory -Force -Path (Split-Path $NodeHome) | Out-Null
    try {
        if (Test-Path $NodeHome) { Remove-Item $NodeHome -Recurse -Force }
        Move-Item (Join-Path $tmp ($zip -replace '\.zip$', '')) $NodeHome
    } catch {
        Fail 'Could not replace the old Node.js. Close any window running MYRACLE (npm run dev), then run setup.cmd again.'
    }
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

    Add-ToUserPath $NodeHome
    $env:Path = "$NodeHome;$env:Path"
}

Say 'Checking for Node.js ...'
if (Test-NodeOk) {
    Write-Host "Found Node.js $(& node -v). Good."
} else {
    $old = Get-NodeVersion
    if ($old) { Write-Host "Found Node.js $old, but MYRACLE needs $NeedMajor.$NeedMinor or newer." }
    else { Write-Host 'Node.js is not installed.' }

    Install-NodeForUser
    if (-not (Test-NodeOk)) {
        Fail "Node.js was installed but does not run. Your PC may block programs in $NodeHome; ask IT to install Node.js 24 LTS."
    }
    Write-Host "Installed Node.js $(& node -v)."

    # A Node.js on the machine PATH comes before the user PATH, so an older one would still
    # win in new windows and `npm run dev` would fail.
    $first = Get-NodeInNewWindow
    if ($first -and ($first -ne (Join-Path $NodeHome 'node.exe'))) {
        Write-Host ''
        Warn "Heads up: new windows will still use the older Node.js at $first."
        Warn 'If it came from nvm-windows, run: nvm install 24 then nvm use 24. Otherwise uninstall it in Settings > Apps.'
        Warn 'This window already uses the new one.'
    }
}

Say "Installing the project's packages ..."
# npm ci installs exactly what package-lock.json lists, so everyone gets the same versions.
# npm.cmd, not npm: PowerShell may block npm.ps1 under the default execution policy.
& npm.cmd ci
if ($LASTEXITCODE -ne 0) { Fail 'Installing packages failed. Read the messages above, or ask in the team chat.' }

Say 'All set. To start MYRACLE any time, open a NEW terminal in this folder and run:  npm run dev'
Write-Host '(If you use VS Code, restart it once so its terminal finds Node.js.)'

$answer = Read-Host 'Start it now? [Y/n]'
if ($answer -eq '' -or $answer -match '^[Yy]') { & npm.cmd run dev -- --open }

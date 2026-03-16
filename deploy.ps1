# ============================================================
# HR Portal - Windows Server Deployment Script
# Run as Administrator in PowerShell
# ============================================================

param(
    [string]$AppPath = "C:\inetpub\hr-portal",
    [string]$SiteName = "HR Portal",
    [int]$HttpsPort = 443,
    [int]$NodePort = 3000
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  HR Portal Deployment" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ---- 1. Verify prerequisites ----
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# PM2
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing PM2 globally..." -ForegroundColor Yellow
    npm install -g pm2
}
Write-Host "  PM2: OK" -ForegroundColor Green

# IIS
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if (-not $iisFeature -or -not $iisFeature.Installed) {
    Write-Host "  ERROR: IIS not installed. Enable via Server Manager -> Add Roles -> Web Server (IIS)" -ForegroundColor Red
    exit 1
}
Write-Host "  IIS: OK" -ForegroundColor Green

# ARR module check
$arrDll = "$env:ProgramFiles\IIS\Application Request Routing\Microsoft.Web.Arr.dll"
if (-not (Test-Path $arrDll)) {
    Write-Host "  WARNING: IIS Application Request Routing (ARR) not detected." -ForegroundColor Yellow
    Write-Host "  Download from: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Yellow
    Write-Host "  Also install: URL Rewrite module from https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
    Read-Host "  Press Enter after installing ARR and URL Rewrite, then re-run this script"
    exit 1
}
Write-Host "  IIS ARR: OK" -ForegroundColor Green

# ---- 2. Copy app files ----
Write-Host ""
Write-Host "[2/8] Copying application files to $AppPath..." -ForegroundColor Yellow

if (-not (Test-Path $AppPath)) {
    New-Item -ItemType Directory -Path $AppPath | Out-Null
}

# Copy everything except dev-only folders
$exclude = @('node_modules', '.git', '.next', 'logs', 'security.db', '.env.local')
Get-ChildItem -Path $PSScriptRoot -Exclude $exclude | Copy-Item -Destination $AppPath -Recurse -Force
New-Item -ItemType Directory -Path "$AppPath\logs" -Force | Out-Null

Write-Host "  Files copied." -ForegroundColor Green

# ---- 3. Check .env.local ----
Write-Host ""
Write-Host "[3/8] Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "$AppPath\.env.local")) {
    Write-Host "  ERROR: .env.local not found at $AppPath\.env.local" -ForegroundColor Red
    Write-Host "  Copy .env.example to .env.local and fill in all values for this county." -ForegroundColor Yellow
    exit 1
}
Write-Host "  .env.local found." -ForegroundColor Green

# ---- 4. Install dependencies ----
Write-Host ""
Write-Host "[4/8] Installing dependencies..." -ForegroundColor Yellow
Push-Location $AppPath
npm install --omit=dev
Write-Host "  Dependencies installed." -ForegroundColor Green

# ---- 5. Build the app ----
Write-Host ""
Write-Host "[5/8] Building Next.js app (this takes a minute)..." -ForegroundColor Yellow
npm run build
Write-Host "  Build complete." -ForegroundColor Green

# ---- 6. Start with PM2 ----
Write-Host ""
Write-Host "[6/8] Starting app with PM2..." -ForegroundColor Yellow
pm2 stop hr-portal --silent 2>$null
pm2 delete hr-portal --silent 2>$null
pm2 start ecosystem.config.cjs
pm2 save
Write-Host "  App running on http://localhost:$NodePort" -ForegroundColor Green

# Register PM2 as a Windows startup service
Write-Host "  Registering PM2 to start on boot..." -ForegroundColor Yellow
pm2 startup --no-daemon 2>&1 | Out-Null
pm2-startup install 2>&1 | Out-Null

Pop-Location

# ---- 7. Configure IIS site ----
Write-Host ""
Write-Host "[7/8] Configuring IIS site..." -ForegroundColor Yellow

Import-Module WebAdministration

# Enable proxy in ARR
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "True"

# Remove existing site if present
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Remove-Website -Name $SiteName
}

# Create site pointing to app folder (web.config lives there)
New-Website -Name $SiteName -Port 80 -PhysicalPath $AppPath -Force | Out-Null

Write-Host "  IIS site '$SiteName' created on port 80." -ForegroundColor Green
Write-Host ""
Write-Host "  NEXT STEP - SSL Certificate:" -ForegroundColor Cyan
Write-Host "  1. Open IIS Manager" -ForegroundColor White
Write-Host "  2. Select the server node -> Server Certificates" -ForegroundColor White
Write-Host "  3. Import your .pfx certificate" -ForegroundColor White
Write-Host "  4. Select '$SiteName' -> Bindings -> Add HTTPS on port $HttpsPort -> select cert" -ForegroundColor White

# ---- 8. Create push notification scheduled task ----
Write-Host ""
Write-Host "[8/8] Setting up push notification scheduled task..." -ForegroundColor Yellow

# Read secret from .env.local
$envContent = Get-Content "$AppPath\.env.local" | Where-Object { $_ -match "^PUSH_CHECK_SECRET=" }
$pushSecret = ($envContent -split "=", 2)[1].Trim()
$nextauthUrl = ((Get-Content "$AppPath\.env.local" | Where-Object { $_ -match "^NEXTAUTH_URL=" }) -split "=", 2)[1].Trim()

if ($pushSecret -and $nextauthUrl) {
    $taskName = "HR Portal - Check Paystubs"
    $taskAction = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NonInteractive -NoProfile -Command `"Invoke-WebRequest -Uri '$nextauthUrl/api/push/check-paystubs' -Method POST -Headers @{Authorization='Bearer $pushSecret'} -UseBasicParsing`""
    $taskTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 1) -Once -At (Get-Date)
    $taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Force | Out-Null
    Write-Host "  Scheduled task '$taskName' created (runs hourly)." -ForegroundColor Green
} else {
    Write-Host "  WARNING: Could not read PUSH_CHECK_SECRET or NEXTAUTH_URL from .env.local" -ForegroundColor Yellow
    Write-Host "  Create the scheduled task manually after SSL is configured." -ForegroundColor Yellow
}

# ---- Done ----
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining manual steps:" -ForegroundColor Cyan
Write-Host "  1. Install SSL certificate in IIS Manager" -ForegroundColor White
Write-Host "  2. Add HTTPS binding to '$SiteName' site" -ForegroundColor White
Write-Host "  3. Verify app at http://localhost:$NodePort (before SSL)" -ForegroundColor White
Write-Host "  4. Test login, paystubs, and push notifications" -ForegroundColor White
Write-Host ""

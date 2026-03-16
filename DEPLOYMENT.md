# HR Portal — County Server Deployment Guide

**Product:** Triadic Enterprises HR Portal
**Platform:** Windows Server + IIS + Node.js
**Estimated time:** 1–2 hours (first time), 30 minutes (subsequent counties)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Software Setup](#2-server-software-setup) *(one-time per server)*
3. [Prepare the Application](#3-prepare-the-application)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Run the Deployment Script](#5-run-the-deployment-script)
6. [Install the SSL Certificate](#6-install-the-ssl-certificate)
7. [Configure IIS HTTPS Binding](#7-configure-iis-https-binding)
8. [Verify the Deployment](#8-verify-the-deployment)
9. [Push Notifications Scheduled Task](#9-push-notifications-scheduled-task)
10. [Ongoing Maintenance](#10-ongoing-maintenance)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before starting, confirm the following are available:

| Item | Who Provides It |
|------|----------------|
| Windows Server 2019 or 2022 | County IT |
| Static IP or hostname for the server | County IT |
| SSL certificate (.pfx file + password) | County IT or Triadic |
| IBM i (AS/400) hostname/IP | County IT |
| IBM i service account username + password | County IT |
| IBM i library names (payroll + employee) | County IT |
| IBM i employee table name | County IT |
| Domain name or internal hostname for the site | County IT |
| Administrator access to the Windows Server | County IT / Triadic |

---

## 2. Server Software Setup

> **This section only needs to be done once per server.** Skip to Section 3 if the server was previously set up.

### 2a. Install IIS

1. Open **Server Manager**
2. Click **Manage → Add Roles and Features**
3. Select **Web Server (IIS)**
4. Under **Role Services**, ensure these are checked:
   - Common HTTP Features (all)
   - Application Development → none required
   - Security → Request Filtering
5. Complete the wizard and click **Install**

### 2b. Install IIS URL Rewrite Module

1. Download from: **https://www.iis.net/downloads/microsoft/url-rewrite**
2. Run the installer
3. Restart IIS: open PowerShell as Administrator and run:
   ```powershell
   iisreset
   ```

### 2c. Install IIS Application Request Routing (ARR)

1. Download from: **https://www.iis.net/downloads/microsoft/application-request-routing**
2. Run the installer
3. Open **IIS Manager**
4. Click the server node (top level) → double-click **Application Request Routing Cache**
5. In the right panel click **Server Proxy Settings**
6. Check **Enable proxy** → click **Apply**

### 2d. Install Node.js

1. Download the **LTS** version from: **https://nodejs.org**
2. Run the installer with default settings
3. Verify in PowerShell:
   ```powershell
   node --version
   npm --version
   ```
   Both should print a version number.

### 2e. Install PM2 (Process Manager)

PM2 keeps the Node.js app running after reboots and crashes.

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 2f. Install IBM i Access Client Solutions (ODBC Driver)

> **Note:** If the county is already running any Triadic software on this server (e.g., http://liveweb.countyName.com), the IBM i Access ODBC Driver is most likely already installed. Skip to step 3 to verify before reinstalling.

1. Obtain **IBM i Access Client Solutions** from county IT or IBM (licensed software)
2. Run the installer and select **ODBC Driver** component
3. After install, open **ODBC Data Source Administrator** (search in Start menu, use 64-bit version)
4. Verify the driver **"IBM i Access ODBC Driver"** appears in the **Drivers** tab

---

## 3. Prepare the Application

### 3a. Copy the application files to the server

Copy the entire `hrwebsite` folder to the server. Recommended location:

```
C:\inetpub\hr-portal\
```

The folder should contain (among others):
```
.env.example
.env.local          ← you will create this in Section 4
ecosystem.config.cjs
web.config
deploy.ps1
app\
lib\
public\
package.json
next.config.mjs
```

> **Do NOT copy** `.next\`, `node_modules\`, or any existing `security.db` from a different county — these are generated fresh on the server.

---

## 4. Configure Environment Variables

1. In `C:\inetpub\hr-portal\`, copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Open `.env.local` in Notepad and fill in every value:

```env
# IBM i Connection
IBM_HOST=192.168.x.x              # IBM i IP address or hostname
IBM_USER=IBMUSERNAME              # IBM i service account username
IBM_PASSWORD=IBMPASSWORD          # IBM i service account password
IBM_DRIVER={IBM i Access ODBC Driver}

# IBM i Libraries (county-specific — ask county IT)
IBM_LIBRARY_PAYROLL=PAYF
IBM_LIBRARY_EMPLOYEE=PAYF
IBM_TABLE_EMPLOYEE=EMPMASZZ       # May differ per county (e.g. INSWORKA)

# County branding
NEXT_PUBLIC_COUNTY_NAME=Luna County
NEXT_PUBLIC_COUNTY_STATE=NM

# NextAuth — must match the HTTPS URL employees will use
NEXTAUTH_URL=https://hr.lunacounty.gov
NEXTAUTH_SECRET=                  # Generate: openssl rand -base64 32

# Web Push / VAPID
# Generate keys by running: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@lunacounty.gov
PUSH_CHECK_SECRET=                # Any strong random string
```

### Generating required secrets

**NEXTAUTH_SECRET** — run in PowerShell (requires OpenSSL, included with Git for Windows):
```powershell
openssl rand -base64 32
```

**VAPID keys** — run in the app folder:
```powershell
npx web-push generate-vapid-keys
```
Copy the public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and private key to `VAPID_PRIVATE_KEY`.

**PUSH_CHECK_SECRET** — any long random string, e.g.:
```powershell
openssl rand -hex 32
```

---

## 5. Run the Deployment Script

1. Open **PowerShell as Administrator**
2. Navigate to the app folder:
   ```powershell
   cd C:\inetpub\hr-portal
   ```
3. Allow script execution (one-time):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. Run the deployment script:
   ```powershell
   .\deploy.ps1
   ```

The script will automatically:
- Verify all prerequisites
- Install Node.js dependencies
- Build the Next.js application
- Start the app on port 3000 via PM2
- Register PM2 to start on boot
- Create the IIS site
- Create the push notification scheduled task

> If the script reports any missing prerequisite, follow the on-screen instructions and re-run it.

---

## 6. Install the SSL Certificate

> County IT should provide a `.pfx` certificate file and its password.

1. Open **IIS Manager** (search in Start menu)
2. Click the **server name** in the left panel (top level)
3. Double-click **Server Certificates**
4. In the right panel click **Import...**
5. Browse to the `.pfx` file, enter the password, click **OK**

The certificate is now available to bind to the site.

---

## 7. Configure IIS HTTPS Binding

1. In **IIS Manager**, expand **Sites** in the left panel
2. Click **HR Portal**
3. In the right panel click **Bindings...**
4. Click **Add...**
   - Type: **https**
   - IP Address: **All Unassigned**
   - Port: **443**
   - SSL Certificate: select the certificate imported in Section 6
5. Click **OK** → **Close**
6. Optionally remove the HTTP port 80 binding (the `web.config` already redirects HTTP → HTTPS)

---

## 8. Verify the Deployment

Test each item in order:

**a. Node.js app running**
```powershell
pm2 status
```
Should show `hr-portal` with status `online`.

**b. App responds on local port**

Open in a browser on the server:
```
http://localhost:3000
```
Should show the login page.

**c. Site accessible over HTTPS**

From any machine on the network:
```
https://hr.lunacounty.gov
```
Should show the login page with a valid padlock.

**d. Login works**
- Log in with a known employee number + SSN
- First-time login should prompt to set a password
- Subsequent logins should go straight to dashboard

**e. Paystubs display correctly**
- Verify paystub data matches actual pay stubs
- Test the print function

**f. Account lockout**
- Enter wrong password 5 times
- Should lock with "Try again in 30 minutes" message
- Use Forgot Password → verify identity → reset → confirm account unlocks

---

## 9. Push Notifications Scheduled Task

The `deploy.ps1` script creates this automatically. To verify it was created:

1. Open **Task Scheduler** (search in Start menu)
2. Look for **HR Portal - Check Paystubs**
3. Confirm it is enabled and set to run hourly

To test it manually:
```powershell
Start-ScheduledTask -TaskName "HR Portal - Check Paystubs"
```

Then check the app logs:
```powershell
pm2 logs hr-portal --lines 20
```

---

## 10. Ongoing Maintenance

### View application logs
```powershell
pm2 logs hr-portal
```

### Restart the application
```powershell
pm2 restart hr-portal
```

### Update the application (new version from Triadic)

1. Copy new files to `C:\inetpub\hr-portal\` (do not overwrite `.env.local` or `security.db`)
2. Open PowerShell as Administrator in the app folder:
   ```powershell
   npm install --omit=dev
   npm run build
   pm2 restart hr-portal
   ```

### Backup

Back up these two files regularly — they contain all employee auth data:
```
C:\inetpub\hr-portal\security.db
C:\inetpub\hr-portal\.env.local
```

### SSL Certificate Renewal

When the certificate expires, repeat Section 6 with the new `.pfx`, then update the IIS binding in Section 7 to select the new certificate.

---

## 11. Troubleshooting

### Site shows IIS default page instead of login
- Confirm the IIS site physical path is set to `C:\inetpub\hr-portal`
- Confirm `web.config` is present in that folder
- Confirm ARR proxy is enabled (Section 2c)

### Login page loads but login fails
- Check IBM i connection: verify `IBM_HOST`, `IBM_USER`, `IBM_PASSWORD` in `.env.local`
- Test ODBC connectivity using the ODBC Data Source Administrator
- Check logs: `pm2 logs hr-portal`

### "NEXTAUTH_SECRET is missing" error
- Ensure `.env.local` has `NEXTAUTH_SECRET` set and is not empty
- Restart after any `.env.local` change: `pm2 restart hr-portal`

### App crashes or won't start
```powershell
pm2 logs hr-portal --err --lines 50
```
Review the error output. Common causes:
- Missing `.env.local`
- IBM i ODBC driver not installed
- Port 3000 in use by another process (`netstat -ano | findstr :3000`)

### Push notifications not arriving
- Verify scheduled task is running (Task Scheduler)
- Check that `PUSH_CHECK_SECRET` in `.env.local` matches what the task sends
- Employees must have clicked **Enable Notifications** on the dashboard
- Push requires HTTPS — won't work over plain HTTP

### After server reboot, site is down
```powershell
pm2 resurrect
```
If this fails, re-run:
```powershell
pm2 start C:\inetpub\hr-portal\ecosystem.config.cjs
pm2 save
```

---

*For support contact Triadic Enterprises.*

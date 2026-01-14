# Electron Standalone Application - Test Checklist

## Pre-Test Setup

### ✅ Step 1: Verify MongoDB Binaries
- [x] MongoDB binaries exist at `resources/mongodb/bin/mongod.exe`
- [x] MongoDB binaries are accessible (not in ASAR)

### ✅ Step 2: Verify Frontend Build
- [x] Frontend built successfully (`npm run build:frontend`)
- [x] `frontend/build/` directory contains compiled assets

### ✅ Step 3: Verify Dependencies
- [x] All npm dependencies installed (`npm install`)
- [x] Electron installed in devDependencies

---

## Test 1: First-Run Wizard Flow

### Preparation
1. Clear existing config to force first-run:
   ```powershell
   Remove-Item -Recurse -Force "$env:APPDATA\SINQ Authoring Tool" -ErrorAction SilentlyContinue
   ```

### Execution
1. Start Electron app:
   ```powershell
   npm run electron
   ```

### Expected Behavior
- [ ] MongoDB starts automatically (check Task Manager for `mongod.exe`)
- [ ] Wizard window appears (not main app window)
- [ ] Wizard shows 3 steps:
  - [ ] Step 1: SMTP Configuration (optional, can skip)
  - [ ] Step 2: Master Tenant Setup
  - [ ] Step 3: Super Admin Account Creation

### Test Inputs
- **SMTP**: Leave disabled (skip)
- **Tenant Name**: `master`
- **Tenant Display Name**: `Master`
- **Admin Email**: `admin@test.com`
- **Admin Password**: `Test1234!`
- **Confirm Password**: `Test1234!`

### Expected Results
- [ ] Wizard form validates password match
- [ ] On submit, wizard closes
- [ ] Backend server starts (check console for "Listening on...")
- [ ] Main app window opens at `http://localhost:3000`
- [ ] No errors in console

---

## Test 2: Config Persistence

### Verification
1. Check config file created:
   ```powershell
   Get-Content "$env:APPDATA\SINQ Authoring Tool\config\config.json"
   ```

### Expected Content
- [ ] `installed: true`
- [ ] `admin.email` present (password should NOT be stored)
- [ ] `masterTenant` configured
- [ ] `dbHost: "127.0.0.1"`
- [ ] `dbPort: 27018`
- [ ] `dbName: "adapt-tenant-master"`

---

## Test 3: MongoDB Data Directory

### Verification
1. Check MongoDB data directory:
   ```powershell
   Test-Path "$env:APPDATA\SINQ Authoring Tool\mongodb\data"
   ```

### Expected Results
- [ ] Directory exists
- [ ] Contains MongoDB database files (`.wt` files or similar)

---

## Test 4: Subsequent Launch (No Wizard)

### Execution
1. Close Electron app completely
2. Restart:
   ```powershell
   npm run electron
   ```

### Expected Behavior
- [ ] MongoDB starts automatically
- [ ] NO wizard window appears
- [ ] Main app window opens directly
- [ ] Backend server starts
- [ ] App loads at `http://localhost:3000`

---

## Test 5: MongoDB Lifecycle

### Verification
1. While app is running, check MongoDB process:
   ```powershell
   Get-Process mongod -ErrorAction SilentlyContinue
   ```

### Expected Results
- [ ] `mongod.exe` process exists
- [ ] Process is child of Electron process
- [ ] MongoDB bound to `127.0.0.1:27018` only:
   ```powershell
   netstat -ano | findstr "27018"
   ```

### Clean Shutdown Test
1. Close Electron app
2. Check MongoDB process:
   ```powershell
   Get-Process mongod -ErrorAction SilentlyContinue
   ```

### Expected Results
- [ ] MongoDB process terminated (no orphaned processes)

---

## Test 6: Admin Login

### Execution
1. In main app window, navigate to login page
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `Test1234!`

### Expected Results
- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] No authentication errors

---

## Test 7: Database Migrations

### Verification
1. Check migration status in MongoDB:
   ```powershell
   # Connect to MongoDB (if mongo.exe available)
   # Or check via app logs
   ```

### Expected Results
- [ ] Migrations ran successfully
- [ ] Collections created (users, tenants, courses, etc.)
- [ ] No migration errors in console

---

## Test 8: Backend Server Health

### Verification
1. Check backend is serving:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
   ```

### Expected Results
- [ ] HTTP 200 response
- [ ] Frontend assets loadable
- [ ] API endpoints accessible

---

## Test 9: Port Conflict Handling

### Execution
1. Start app (uses port 3000)
2. Try to start another instance

### Expected Results
- [ ] Second instance handles port conflict gracefully
- [ ] Error message shown (if applicable)
- [ ] No crashes

---

## Test 10: SMTP Configuration (Optional)

### Execution
1. Clear config again
2. Run wizard with SMTP enabled:
   - Enable SMTP
   - Service: `gmail` (or custom)
   - Enter test credentials

### Expected Results
- [ ] SMTP config saved
- [ ] App still functions without SMTP server running
- [ ] Email sending fails gracefully (if tested)

---

## Build Test: Create Installer

### Prerequisites
- [ ] All above tests pass
- [ ] Frontend built
- [ ] MongoDB binaries in place

### Execution
```powershell
npm run build:electron:win
```

### Expected Results
- [ ] Installer created in `dist/` directory
- [ ] `.exe` file generated
- [ ] No build errors

---

## Installation Test (Clean Machine)

### Execution
1. Install generated `.exe` on clean Windows machine (or VM)
2. Run installer
3. Launch application

### Expected Results
- [ ] No Node.js required
- [ ] No MongoDB installation required
- [ ] No Git required
- [ ] App launches successfully
- [ ] Wizard appears on first run
- [ ] App works offline

---

## Error Scenarios

### Test: MongoDB Binary Missing
1. Temporarily rename `resources/mongodb/bin/mongod.exe`
2. Start app

### Expected Results
- [ ] Clear error message
- [ ] App does not crash
- [ ] User-friendly error displayed

### Test: Port Already in Use
1. Start another service on port 3000
2. Start app

### Expected Results
- [ ] App detects port conflict
- [ ] Error message shown
- [ ] Graceful failure

---

## Performance Checks

### Expected Metrics
- [ ] App starts within 10 seconds
- [ ] MongoDB starts within 5 seconds
- [ ] Backend ready within 3 seconds
- [ ] Memory usage reasonable (< 500MB total)

---

## Security Checks

### Verification
- [ ] MongoDB only bound to localhost
- [ ] No external network access for MongoDB
- [ ] Admin password not stored in plain text
- [ ] Session secret is random and unique
- [ ] IPC communication secured (contextIsolation: true)

---

## Final Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] No orphaned processes
- [ ] Config persists correctly
- [ ] App works offline
- [ ] Installer builds successfully
- [ ] Ready for distribution

---

## Notes

- If any test fails, document the error and fix before proceeding
- Test on clean user profile to simulate first-time user experience
- Verify MongoDB data persists across app restarts
- Ensure no external dependencies required at runtime


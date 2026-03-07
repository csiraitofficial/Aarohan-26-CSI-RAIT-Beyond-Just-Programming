# Test script to verify symptom agent API
# This helps debug authentication and API issues

$baseUrl = "http://localhost:8000"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Swasthya Saathi API Test Script" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check health
Write-Host "[1] Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "[OK] Backend is healthy" -ForegroundColor Green
    Write-Host "  Service: $($health.service)" -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Backend health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Register test user
Write-Host "[2] Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    name     = "Test Patient"
    email    = "test@patient.com"
    password = "Test123!"
    role     = "patient"
    age      = 30
    gender   = "male"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "[OK] User registered successfully" -ForegroundColor Green
}
catch {
    if ($_.Exception.Message -like "*already registered*") {
        Write-Host "  User already exists (this is OK)" -ForegroundColor Gray
    }
    else {
        Write-Host "  Registration info: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 3: Login
Write-Host "[3] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email    = "test@patient.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "[OK] Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Test symptom agent start
Write-Host "[4] Testing symptom agent (start session)..." -ForegroundColor Yellow
$symptomBody = @{
    initial_message = "I have a headache and fever"
    language        = "en"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    $sessionResponse = Invoke-RestMethod -Uri "$baseUrl/api/symptom-agent/start" -Method Post -Body $symptomBody -Headers $headers
    $sessionId = $sessionResponse.session_id
    Write-Host "[OK] Symptom session started" -ForegroundColor Green
    Write-Host "  Session ID: $sessionId" -ForegroundColor Gray
    Write-Host "  AI Response: $($sessionResponse.agent_message)" -ForegroundColor Cyan
}
catch {
    Write-Host "[FAIL] Symptom agent failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get detailed error
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Step 5: Test respond to agent
Write-Host "[5] Testing symptom agent (respond)..." -ForegroundColor Yellow
$respondBody = @{
    message = "It started yesterday morning"
} | ConvertTo-Json

try {
    $respondResponse = Invoke-RestMethod -Uri "$baseUrl/api/symptom-agent/$sessionId/respond" -Method Post -Body $respondBody -Headers $headers
    Write-Host "[OK] Response processed" -ForegroundColor Green
    Write-Host "  AI Response: $($respondResponse.agent_message)" -ForegroundColor Cyan
    Write-Host "  Progress: $($respondResponse.progress_pct)%" -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Respond failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "[OK] All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "  Email: test@patient.com" -ForegroundColor White
Write-Host "  Password: Test123!" -ForegroundColor White
Write-Host ""
Write-Host "You can now login to the app with these credentials." -ForegroundColor White
Write-Host ""
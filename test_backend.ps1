Write-Host "Testing Django Backend on http://localhost:8000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing /api/appointments/ endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/appointments/" -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    if ($data.results) {
        Write-Host "   Found $($data.count) appointments" -ForegroundColor Green
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "2. Testing /api/history/ endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/history/" -UseBasicParsing -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. Testing /api/doctors/ endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/doctors/" -UseBasicParsing -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "4. Testing /api/feedback/ endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/feedback/" -UseBasicParsing -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing complete!" -ForegroundColor Cyan

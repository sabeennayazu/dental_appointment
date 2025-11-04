Write-Host "Testing Appointment Approval via API" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test if backend is running
Write-Host "Checking backend..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri "http://localhost:8000/api/appointments/" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not running. Start it first!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "To test approval/rejection:" -ForegroundColor Yellow
Write-Host "1. Create an appointment in Django admin or Next.js admin" -ForegroundColor White
Write-Host "2. Note the appointment ID" -ForegroundColor White
Write-Host "3. Approve/reject it from either admin panel" -ForegroundColor White
Write-Host "4. Check that:" -ForegroundColor White
Write-Host "   - Appointment disappears from active list" -ForegroundColor White
Write-Host "   - Appointment appears in history" -ForegroundColor White
Write-Host "   - History shows correct status change" -ForegroundColor White
Write-Host ""

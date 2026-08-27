# Start Backend
Write-Host "Starting Merchant's Adversarial Shadow Backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000

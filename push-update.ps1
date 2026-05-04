# Quick-update helper: stage everything, commit, push.
# Usage:   .\push-update.ps1 "your commit message"
# Example: .\push-update.ps1 "Update bed dimensions"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Refuse to commit if SolidWorks is open (lock files would get committed).
if (Get-Process SLDWORKS -ErrorAction SilentlyContinue) {
    Write-Host "SolidWorks is running. Save and close it first, then re-run." -ForegroundColor Yellow
    exit 1
}

# Show what changed
git status --short
Write-Host ""
Write-Host "Committing with message: $Message" -ForegroundColor Cyan
Write-Host ""

git add .
git commit -m $Message
git push

Write-Host ""
Write-Host "Pushed to https://github.com/yo12344444444444/open-cnc-for-all" -ForegroundColor Green

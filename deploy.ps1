# Vercel Zero-Dependency Deployment Script
# This script deploys the AgilePO AI Agent directly to Vercel using the Vercel REST API.

param(
    [string]$Token
)

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   AgilePO AI - Vercel Deployment Assistant   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Request Vercel Personal Access Token if not provided
if (-not $Token) {
    Write-Host "To deploy, you need a Vercel Personal Access Token." -ForegroundColor Yellow
    Write-Host "If you do not have one, create it here: https://vercel.com/account/tokens" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host "Enter Vercel Access Token (Bearer)"
}
$Token = $Token.Trim()

if (-not $Token) {
    Write-Error "Vercel Access Token cannot be empty."
    exit
}

# Helper to escape string for JSON
function Escape-JsonString ($str) {
    if (-not $str) { return '""' }
    # Escape backslashes, double quotes, and control chars
    $escaped = $str.Replace('\', '\\').Replace('"', '\"').Replace("`r", '\r').Replace("`n", '\n').Replace("`t", '\t')
    return '"' + $escaped + '"'
}

# 2. Define files and read their contents
Write-Host "Reading project files..." -ForegroundColor Gray

if (-not (Test-Path "index.html")) { Write-Error "index.html not found"; exit }
if (-not (Test-Path "styles.css")) { Write-Error "styles.css not found"; exit }
if (-not (Test-Path "app.js")) { Write-Error "app.js not found"; exit }
if (-not (Test-Path "samples/spec_spec.pdf")) { Write-Error "samples/spec_spec.pdf not found"; exit }
if (-not (Test-Path "samples/sla_contract.pdf")) { Write-Error "samples/sla_contract.pdf not found"; exit }
if (-not (Test-Path "samples/market_intel.pdf")) { Write-Error "samples/market_intel.pdf not found"; exit }
if (-not (Test-Path "samples/supplier_agreement.pdf")) { Write-Error "samples/supplier_agreement.pdf not found"; exit }

$htmlContent = Get-Content -Path "index.html" -Raw -Encoding utf8
$cssContent = Get-Content -Path "styles.css" -Raw -Encoding utf8
$jsContent = Get-Content -Path "app.js" -Raw -Encoding utf8

# Read PDFs as base64 strings
$specPdfB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("samples/spec_spec.pdf"))
$slaPdfB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("samples/sla_contract.pdf"))
$marketPdfB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("samples/market_intel.pdf"))
$supplierPdfB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("samples/supplier_agreement.pdf"))

Write-Host "Escaping files for JSON payload..." -ForegroundColor Gray
$escHtml = Escape-JsonString $htmlContent
$escCss = Escape-JsonString $cssContent
$escJs = Escape-JsonString $jsContent

# 3. Formulate JSON payload manually to bypass ConvertTo-Json performance bugs
Write-Host "Assembling payload..." -ForegroundColor Gray
$body = @"
{
  "name": "agile-po-agent",
  "files": [
    { "file": "index.html", "data": $escHtml },
    { "file": "styles.css", "data": $escCss },
    { "file": "app.js", "data": $escJs },
    { "file": "samples/spec_spec.pdf", "data": "$specPdfB64", "encoding": "base64" },
    { "file": "samples/sla_contract.pdf", "data": "$slaPdfB64", "encoding": "base64" },
    { "file": "samples/market_intel.pdf", "data": "$marketPdfB64", "encoding": "base64" },
    { "file": "samples/supplier_agreement.pdf", "data": "$supplierPdfB64", "encoding": "base64" }
  ],
  "projectSettings": {
    "framework": null
  }
}
"@

# 4. Invoke Vercel Deployment API
Write-Host "Deploying to Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method Post -Headers $headers -Body $body
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "      Deployment Successful!                 " -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "Project Name:   $($response.name)" -ForegroundColor Gray
    Write-Host "Deployment URL: https://$($response.url)" -ForegroundColor White
    Write-Host "Inspector URL:  https://vercel.com/$($response.ownerId)/$($response.name)/$($response.id)" -ForegroundColor Gray
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "Deployment failed. Details:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResp = $reader.ReadToEnd()
        Write-Host $errResp -ForegroundColor Yellow
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

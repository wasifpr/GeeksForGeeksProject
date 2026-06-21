# PowerShell GitHub Publisher Script using REST API
# Pushes the local workspace directly to a GitHub repository.

param(
    [string]$Username,
    [string]$RepoName,
    [string]$Token,
    [bool]$Private = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     GitHub REST API Publishing Assistant     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Prompt for inputs if they were not supplied as arguments
if (-not $Username) {
    $Username = Read-Host "Enter GitHub Username"
}
$Username = $Username.Trim()

if (-not $RepoName) {
    $RepoName = Read-Host "Enter Target Repository Name"
}
$RepoName = $RepoName.Trim()

if (-not $Token) {
    Write-Host "You need a GitHub Personal Access Token (PAT) with 'repo' scope." -ForegroundColor Yellow
    Write-Host "Create one here: https://github.com/settings/tokens" -ForegroundColor Yellow
    $Token = Read-Host "Enter GitHub Personal Access Token"
}
$Token = $Token.Trim()

if (-not $Username -or -not $RepoName -or -not $Token) {
    Write-Error "Username, Repository Name, and Access Token are required."
    exit
}

$headers = @{
    "Authorization" = "token $Token"
    "Accept"        = "application/vnd.github.v3+json"
}

# 2. Verify Credentials
Write-Host "Verifying GitHub credentials..." -ForegroundColor Gray
try {
    $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    Write-Host "Authenticated as: $($userResponse.login) ($($userResponse.name))" -ForegroundColor Green
} catch {
    Write-Host "Authentication failed. Please verify your token." -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
    }
    exit
}

# 3. Create repository if it doesn't exist
Write-Host "Checking if repository '$RepoName' exists..." -ForegroundColor Gray
$repoExists = $false
try {
    $repoResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName" -Headers $headers -Method Get
    $repoExists = $true
    Write-Host "Repository '$RepoName' already exists. We will update the files in place." -ForegroundColor Yellow
} catch {
    # If 404, repository does not exist
    if ($_.Exception.Response.StatusCode -eq "NotFound") {
        Write-Host "Repository does not exist. Creating repository..." -ForegroundColor Gray
        $body = @{
            name = $RepoName
            private = $Private
            description = "Agile PO & SOW Audit Agent application"
        } | ConvertTo-Json

        try {
            $repoResponse = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body
            Write-Host "Repository '$RepoName' created successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to create repository." -ForegroundColor Red
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
            }
            exit
        }
    } else {
        Write-Host "Error checking repository: $_" -ForegroundColor Red
        exit
    }
}

# 4. Get list of files to upload
Write-Host "Collecting files to upload..." -ForegroundColor Gray
$basePath = Get-Location
$files = Get-ChildItem -Path $basePath -Recurse -File | Where-Object {
    $rel = $_.FullName.Replace($basePath.Path, "").TrimStart("\").Replace("\", "/")
    # Ignore patterns
    $rel -notmatch "^\.git(/|$)" -and
    $rel -notmatch "^\.vercel(/|$)" -and
    $rel -notmatch "^\.agents(/|$)" -and
    $rel -notmatch "^publish_github\.ps1$" -and
    $rel -notmatch "deploy_config\.json" -and
    $rel -notmatch "\.log$"
}

Write-Host "Found $($files.Count) files to publish." -ForegroundColor Gray

# 5. Upload files one-by-one
foreach ($file in $files) {
    # Calculate path relative to workspace root
    $relPath = $file.FullName.Replace($basePath.Path, "").TrimStart("\").Replace("\", "/")
    
    Write-Host "Processing file: $relPath" -ForegroundColor Gray
    
    # Read file content as base64
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64Content = [Convert]::ToBase64String($bytes)
    
    # Check if file exists on GitHub to get its SHA (required for updating)
    $sha = $null
    try {
        $fileResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/contents/$relPath" -Headers $headers -Method Get
        $sha = $fileResponse.sha
    } catch {
        # If it doesn't exist, that's fine ($sha remains null)
    }

    # Upload/Update file
    $bodyObj = @{
        message = "Upload $relPath"
        content = $base64Content
    }
    if ($sha) {
        $bodyObj.sha = $sha
    }
    $body = $bodyObj | ConvertTo-Json -Depth 5 -Compress

    try {
        $uploadUrl = "https://api.github.com/repos/$Username/$RepoName/contents/$relPath"
        $uploadResponse = Invoke-RestMethod -Uri $uploadUrl -Headers $headers -Method Put -Body $body
        if ($sha) {
            Write-Host "Updated: $relPath" -ForegroundColor Green
        } else {
            Write-Host "Created: $relPath" -ForegroundColor Green
        }
    } catch {
        Write-Host "Failed to upload: $relPath" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "      All files processed successfully!       " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "GitHub Repository: https://github.com/$Username/$RepoName" -ForegroundColor White
Write-Host ""

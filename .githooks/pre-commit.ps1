#!/usr/bin/env pwsh

$maxSize = 500 * 1024
$largeFiles = @()

git diff --cached --name-only --diff-filter=ACM | ForEach-Object {
    $file = $_
    if (Test-Path -Path $file -PathType Leaf) {
        $size = (Get-Item $file).Length
        if ($size -gt $maxSize) {
            $sizeKB = [math]::Round($size / 1024, 2)
            $largeFiles += "$file ($sizeKB KB)"
        }
    }
}

if ($largeFiles.Count -gt 0) {
    Write-Host "ERROR: The following files exceed the maximum allowed size (500KB):" -ForegroundColor Red
    $largeFiles | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please consider using git-lfs for large files or remove these files from the commit." -ForegroundColor Yellow
    exit 1
}

exit 0
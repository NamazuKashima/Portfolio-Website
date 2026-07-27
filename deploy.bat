@echo off
setlocal

REM ==========================================================
REM  Deploy: bump cache-busting version, commit, push
REM  Run this instead of pushing manually.
REM ==========================================================

cd /d "%~dp0"

if exist ".git\index.lock" del /f /q ".git\index.lock"

echo Bumping asset versions...

powershell -NoProfile -Command ^
  "$stamp = Get-Date -Format 'yyyyMMddHHmm';" ^
  "Get-ChildItem -Path . -Filter *.html | ForEach-Object {" ^
  "  $p = $_.FullName;" ^
  "  $t = Get-Content $p -Raw -Encoding UTF8;" ^
  "  $t = [regex]::Replace($t, '(href=\"css/[^\"?]+)(\?v=\d+)?\"', ('${1}?v=' + $stamp + '\"'));" ^
  "  $t = [regex]::Replace($t, '(src=\"js/[^\"?]+)(\?v=\d+)?\"',   ('${1}?v=' + $stamp + '\"'));" ^
  "  [System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding $false));" ^
  "  Write-Host ('  updated ' + $_.Name);" ^
  "};" ^
  "Write-Host ('Version: ' + $stamp)"

echo.
echo Committing and pushing...

git add -A
git commit -m "Update site"
git push origin main

echo.
echo ============================================
echo  Deployed. Live in ~1-2 minutes at:
echo  https://www.victorqixunwu.com
echo ============================================
pause

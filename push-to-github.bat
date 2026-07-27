@echo off
setlocal

REM ======================================
REM  Push to GitHub - Portfolio-Website
REM  Generate a token first at:
REM  https://github.com/settings/tokens
REM  (check the "repo" scope)
REM ======================================

cd /d "%~dp0"

if exist ".git\index.lock" del /f /q ".git\index.lock"

set /p TOKEN=Enter your GitHub Personal Access Token:

git init
git branch -M main
git config user.email "catfishvvic@gmail.com"
git config user.name "NamazuKashima"

git add -A
git commit -m "Update portfolio site"

git remote remove origin >nul 2>nul
git remote add origin https://NamazuKashima:%TOKEN%@github.com/NamazuKashima/Portfolio-Website.git

git push -u origin main --force

echo.
echo ============================================
echo  Done! Repo: https://github.com/NamazuKashima/Portfolio-Website
echo  Next: go to Settings - Pages and enable GitHub Pages
echo  Custom domain: www.victorqixunwu.com
echo ============================================
pause

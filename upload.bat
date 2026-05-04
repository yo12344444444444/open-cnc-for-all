@echo off
REM Double-click this file to upload your changes to GitHub.
REM Asks you for a short message describing what you changed.

cd /d "%~dp0"

REM Refuse to run if SolidWorks is open - it would commit ~$ lock files.
tasklist /FI "IMAGENAME eq SLDWORKS.exe" 2>NUL | find /I "SLDWORKS.exe" >NUL
if not errorlevel 1 (
    echo.
    echo  SolidWorks is running. Please SAVE and CLOSE it first, then run this again.
    echo.
    pause
    exit /b 1
)

echo.
echo === What changed? ===
git status --short
echo.

set /p MSG=Describe what you changed (one line):

if "%MSG%"=="" (
    echo No message entered. Cancelled.
    pause
    exit /b 1
)

echo.
echo Uploading...
echo.

git add .
if errorlevel 1 goto :err

git commit -m "%MSG%"
if errorlevel 1 goto :err

git push
if errorlevel 1 goto :err

echo.
echo  ===========================================================
echo   Done! Your changes are live at:
echo   https://github.com/yo12344444444444/open-cnc-for-all
echo  ===========================================================
echo.
pause
exit /b 0

:err
echo.
echo  Something went wrong. Read the message above.
echo.
pause
exit /b 1

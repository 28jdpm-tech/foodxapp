@echo off
:: Script para iniciar FoodX POS con impresión automática (sin diálogo)
:: Ejecutar este archivo para abrir la aplicación

echo ========================================
echo   Iniciando FoodX POS PRO (Local)
echo   (Impresion automatica habilitada)
echo ========================================

:: Cierra Chrome existente (opcional - comentar si causa problemas)
:: taskkill /f /im chrome.exe 2>nul

set "LOCAL_HTML=%~dp0..\index.html"

:: Abre Chrome con impresión kiosko apuntando a la versión local
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app="%LOCAL_HTML%"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing --app="%LOCAL_HTML%"
) else (
    start "" "%LOCAL_HTML%"
)

exit

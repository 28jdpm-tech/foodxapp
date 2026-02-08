@echo off
:: Script para iniciar FoodX POS con impresión automática (sin diálogo)
:: Ejecutar este archivo para abrir la aplicación

echo ========================================
echo   Iniciando FoodX POS PRO
echo   (Impresion automatica habilitada)
echo ========================================

:: Cierra Chrome existente (opcional - comentar si causa problemas)
:: taskkill /f /im chrome.exe 2>nul

:: Abre Chrome con impresión kiosko
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://28jdpm-tech.github.io/foodxapp/

:: Si Chrome está en otra ubicación, usa esta línea alternativa:
:: start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://28jdpm-tech.github.io/foodxapp/

exit

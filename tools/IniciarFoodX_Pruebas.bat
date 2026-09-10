@echo off
:: Script para iniciar FoodX POS en MODO PRUEBA (datos aislados)
echo ========================================
echo   Iniciando FoodX POS PRO [MODO PRUEBA]
echo   (No afecta los pedidos del restaurante)
echo ========================================

if exist C:\Program Files\Google\Chrome\Application\chrome.exe (
    start " C:\Program Files\Google\Chrome\Application\chrome.exe --app=https://28jdpm-tech.github.io/foodxapp/?test=true
) else if exist C:\Program Files (x86)\Google\Chrome\Application\chrome.exe (
 start  C:\Program Files (x86)\Google\Chrome\Application\chrome.exe --app=https://28jdpm-tech.github.io/foodxapp/?test=true
) else (
 start  https://28jdpm-tech.github.io/foodxapp/?test=true
)

exit

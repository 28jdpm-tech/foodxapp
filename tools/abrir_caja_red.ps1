# Script para abrir caja monedero conectada por Ethernet
# Ejecutar con doble clic en el archivo .bat o desde PowerShell

# =============================================
# CONFIGURACION - Modifica estos valores segun tu monedero
# =============================================
$DRAWER_IP = "192.168.1.100"  # IP del monedero (cambiar si es diferente)
$DRAWER_PORT = 9100           # Puerto (9100 es el estandar para dispositivos POS)
# =============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ABRIR CAJA MONEDERO (Ethernet)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Intentando abrir caja en: $DRAWER_IP`:$DRAWER_PORT"
Write-Host ""

# Comando ESC/POS para abrir caja: ESC p 0 25 250
$drawerCommand = [byte[]]@(0x1B, 0x70, 0x00, 0x19, 0xFA)

try {
    # Crear conexion TCP
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($DRAWER_IP, $DRAWER_PORT)
    
    # Obtener stream y enviar comando
    $stream = $tcpClient.GetStream()
    $stream.Write($drawerCommand, 0, $drawerCommand.Length)
    $stream.Flush()
    
    # Cerrar conexion
    $stream.Close()
    $tcpClient.Close()
    
    Write-Host "CAJA ABIERTA!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "ERROR: No se pudo conectar al monedero" -ForegroundColor Red
    Write-Host "Detalles: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Cyan
    Write-Host "1. Verifica que el monedero este encendido y conectado"
    Write-Host "2. Revisa la IP del monedero y actualiza el script"
    Write-Host "3. El puerto puede ser diferente a 9100"
    Write-Host ""
    
    # Mostrar adaptadores de red para ayudar a identificar la IP
    Write-Host "Tus adaptadores de red:" -ForegroundColor Cyan
    Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.IPAddress -ne '127.0.0.1' } | 
    Select-Object InterfaceAlias, IPAddress | Format-Table -AutoSize
}

Write-Host "Presiona Enter para cerrar..."
Read-Host

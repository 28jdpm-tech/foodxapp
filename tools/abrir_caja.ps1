# Script para abrir caja monedero via impresora ESDPRT001
# Ejecutar con: powershell -ExecutionPolicy Bypass -File abrir_caja.ps1

# Metodo 1: Intentar via nombre de impresora compartida
$printerName = "ESDPRT001"

try {
    # ESC/POS command to open cash drawer: ESC p 0 25 250
    $drawerCommand = [byte[]]@(0x1B, 0x70, 0x00, 0x19, 0xFA)
    
    # Get printer
    $printer = Get-Printer | Where-Object { $_.Name -like "*$printerName*" -or $_.Name -like "*POS*" -or $_.Name -like "*thermal*" }
    
    if ($printer) {
        Write-Host "Impresora encontrada: $($printer.Name)"
        
        # Try to get the port
        $port = $printer.PortName
        Write-Host "Puerto: $port"
        
        if ($port -match "COM\d+") {
            # It's a COM port
            $serialPort = New-Object System.IO.Ports.SerialPort($port, 9600)
            $serialPort.Open()
            $serialPort.Write($drawerCommand, 0, $drawerCommand.Length)
            $serialPort.Close()
            Write-Host "Caja abierta via $port" -ForegroundColor Green
        } else {
            # Try writing to the printer directly
            $printJob = [System.Drawing.Printing.PrintDocument]::new()
            $printJob.PrinterSettings.PrinterName = $printer.Name
            
            # Alternative: Use raw print
            Add-Type -AssemblyName System.Drawing
            
            $docInfo = New-Object System.Drawing.Printing.PrintDocument
            $docInfo.PrinterSettings.PrinterName = $printer.Name
            
            Write-Host "Intentando abrir caja via impresora Windows..."
            
            # Use file-based approach
            $tempFile = [System.IO.Path]::GetTempFileName()
            [System.IO.File]::WriteAllBytes($tempFile, $drawerCommand)
            
            # Print raw file
            Start-Process -FilePath "print" -ArgumentList "/d:$($printer.Name)", $tempFile -NoNewWindow -Wait
            Remove-Item $tempFile -ErrorAction SilentlyContinue
            
            Write-Host "Comando enviado" -ForegroundColor Green
        }
    } else {
        Write-Host "No se encontro impresora con nombre similar a '$printerName'" -ForegroundColor Yellow
        Write-Host "Impresoras disponibles:"
        Get-Printer | ForEach-Object { Write-Host "  - $($_.Name) ($($_.PortName))" }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..."
Read-Host

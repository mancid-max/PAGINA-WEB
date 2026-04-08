$sourcePath = "C:\Users\manuh\OneDrive - Mohicano Jeans\INVENTARIO 01-04 COMPLETO.xlsx"
$projectPath = "C:\Users\manuh\Desktop\Backup\PAGINA WEB"
$logPath = Join-Path $projectPath ".watch-stock.out.log"
$errPath = Join-Path $projectPath ".watch-stock.err.log"
$stockFile = "stock-data.json"

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "No se encontro el archivo: $sourcePath"
}

"Observando cambios en: $sourcePath" | Set-Content -LiteralPath $logPath -Encoding UTF8
"" | Set-Content -LiteralPath $errPath -Encoding UTF8

Push-Location $projectPath
try {
  function Write-Log($message) {
    $message | Tee-Object -FilePath $logPath -Append
  }

  function Write-ErrLog($message) {
    $message | Tee-Object -FilePath $errPath -Append
  }

  function Publish-StockIfChanged() {
    try {
      & git add -- $stockFile | Out-Null
      & git diff --cached --quiet -- $stockFile
      if ($LASTEXITCODE -eq 0) {
        Write-Log "Sin cambios en stock-data.json; no se publica."
        return
      }

      $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      Write-Log "Cambios detectados en stock-data.json; publicando..."
      & git commit -m "Auto-update stock data ($timestamp)" -- $stockFile | Tee-Object -FilePath $logPath -Append
      if ($LASTEXITCODE -ne 0) {
        Write-ErrLog "No se pudo crear el commit automatico."
        return
      }

      & git push origin HEAD | Tee-Object -FilePath $logPath -Append
      if ($LASTEXITCODE -ne 0) {
        Write-ErrLog "No se pudo hacer push automatico."
      }
    } catch {
      $_ | Out-String | Write-ErrLog
    }
  }

  python parse_stock_excel.py | Tee-Object -FilePath $logPath -Append
  Publish-StockIfChanged
  $lastWrite = (Get-Item -LiteralPath $sourcePath).LastWriteTimeUtc

  while ($true) {
    Start-Sleep -Seconds 10
    $currentWrite = (Get-Item -LiteralPath $sourcePath).LastWriteTimeUtc
    if ($currentWrite -ne $lastWrite) {
      $lastWrite = $currentWrite
      Write-Log "Cambio detectado en Excel, regenerando stock-data.json..."
      try {
        python parse_stock_excel.py | Tee-Object -FilePath $logPath -Append
        Publish-StockIfChanged
      } catch {
        $_ | Out-String | Write-ErrLog
      }
    }
  }
} finally {
  Pop-Location
}

# generate-stock-from-bi.ps1
# Lee Z:\BI\ARCHIVO_TALLAS.CSV (fila "stock", por talla) y genera:
#   - stock-data-catalogo-2.json   (Cole 40, 41 -> pagina cole-40-41)
#   - stock-data-catalogo-43.json  (Cole 40, 41, 42, 43 -> index y cole-43)
#   (Cole 44 queda manual, no se toca)
# Se ejecuta desde "ADECOM WEB\auto_build.bat" (tareas 8:20 / 14:20 / 17:20).
# Excepciones opcionales: stock-overrides.json en la raiz del repo, formato
#   { "4416-00": { "total": 60 } }  -> fuerza el total (y opcionalmente "sizes").
# Uso manual: powershell -NoProfile -ExecutionPolicy Bypass -File generate-stock-from-bi.ps1 [-NoPush]

param([switch]$NoPush)

$csvPath   = 'Z:\BI\ARCHIVO_TALLAS.CSV'
$repoPath  = 'c:\Users\Lenovo\Desktop\Backup\Data Manu\Backup\PAGINA WEB'
$overrides = Join-Path $repoPath 'stock-overrides.json'
$tipo      = 'stock'

# Cole 44 NO se sincroniza: stock-data-catalogo-44.json se mantiene manual (decision de Manu, 2026-09-04)
$targets = @(
    @{ file = 'stock-data-catalogo-2.json';  pattern = '^014[01]\d{4}$';  label = 'Cole 40-41 (cole-40-41)' },
    @{ file = 'stock-data-catalogo-43.json'; pattern = '^014[0-3]\d{4}$'; label = 'Cole 40-43 (index, cole-43)' }
)

if (-not (Test-Path $csvPath)) {
    Write-Error "No se encuentra $csvPath - revisar que Z: este montado"
    exit 1
}

# --- Excepciones (opcional) ---
$ov = @{}
if (Test-Path $overrides) {
    try {
        $raw = Get-Content $overrides -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($p in $raw.PSObject.Properties) { $ov[$p.Name] = $p.Value }
    } catch { Write-Warning "stock-overrides.json invalido, se ignora: $_" }
}

# --- Leer CSV una sola vez ---
$enc       = [System.Text.Encoding]::GetEncoding(1252)
$reader    = New-Object System.IO.StreamReader($csvPath, $enc)
$sizeNames = @('36','38','40','42','44','46','48','50','52')
$byTarget  = @{}
foreach ($t in $targets) { $byTarget[$t.file] = @{} }

while ($true) {
    $line = $reader.ReadLine()
    if ($null -eq $line) { break }
    $p = $line -split ';'
    if ($p.Count -lt 15) { continue }
    $art = $p[0].Trim()
    if ($p[3].Trim() -ne $tipo) { continue }

    # Un articulo puede pertenecer a varios archivos (ej. Cole 40 va a catalogo-2 y a catalogo-43)
    $matched = @($targets | Where-Object { $art -match $_.pattern })
    if ($matched.Count -eq 0) { continue }

    # 01CCMMVV -> CCMM-VV
    $family = $art.Substring(2, 4) + '-' + $art.Substring(6, 2)

    $sizes = @{}; $total = 0
    for ($i = 0; $i -lt 9; $i++) {
        $rawv = $p[5 + $i].Trim() -replace '[^0-9\-]', ''
        $val = 0; [void][int]::TryParse($rawv, [ref]$val)
        if ($val -lt 0) { $val = 0 }
        $sizes[$sizeNames[$i]] = $val
        $total += $val
    }

    foreach ($t in $matched) {
        $items = $byTarget[$t.file]
        if ($items.ContainsKey($family)) {
            foreach ($sz in $sizeNames) { $items[$family].sizes[$sz] += $sizes[$sz] }
            $items[$family].total += $total
        } else {
            $items[$family] = @{
                article     = $family
                sku         = $family
                description = $p[1].Trim()
                sizes       = $sizes.Clone()
                total       = $total
            }
        }
    }
}
$reader.Close()

# --- Aplicar excepciones y escribir JSON ---
$changedFiles = @()
foreach ($t in $targets) {
    $items = $byTarget[$t.file]
    foreach ($code in $ov.Keys) {
        if (-not $items.ContainsKey($code)) {
            $items[$code] = @{ article = $code; sku = $code; description = 'OVERRIDE'; sizes = @{}; total = 0 }
        }
        if ($null -ne $ov[$code].total) { $items[$code].total = [int]$ov[$code].total }
        if ($null -ne $ov[$code].sizes) {
            $s = @{}; foreach ($q in $ov[$code].sizes.PSObject.Properties) { $s[$q.Name] = [int]$q.Value }
            $items[$code].sizes = $s
        }
        $items[$code].override = $true
    }

    $output = [ordered]@{
        generated_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
        source_file  = $csvPath
        item_count   = $items.Count
        items        = $items
    }
    $outPath = Join-Path $repoPath $t.file
    $json = $output | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($outPath, $json, [System.Text.Encoding]::UTF8)
    Write-Output "$(Get-Date -Format 'HH:mm:ss') $($t.label): $($items.Count) articulos -> $($t.file)"
    $changedFiles += $t.file
}

# --- Git commit + push ---
Set-Location $repoPath
git add -- $changedFiles 2>&1 | Out-Null
$status = git status --porcelain -- $changedFiles
if (-not $status) {
    Write-Output "$(Get-Date -Format 'HH:mm:ss') Sin cambios, no se hizo push"
    exit 0
}
if ($NoPush) {
    Write-Output "$(Get-Date -Format 'HH:mm:ss') -NoPush: cambios generados pero NO commiteados"
    git reset -q -- $changedFiles
    exit 0
}
$msg = "auto: stock desde Z:\BI $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $msg -- $changedFiles 2>&1 | Out-Null
git push origin main 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Output "$(Get-Date -Format 'HH:mm:ss') Push a Netlify OK" }
else { Write-Output "$(Get-Date -Format 'HH:mm:ss') ERROR en push (codigo $LASTEXITCODE)"; exit 1 }

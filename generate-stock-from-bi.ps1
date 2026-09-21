# generate-stock-from-bi.ps1
# Lee Z:\BI\ARCHIVO_TALLAS.CSV (fila "stock", por talla) y genera:
#   - stock-data-catalogo-2.json   (Cole 40, 41 -> pagina cole-40-41)
#   - stock-data-catalogo-43.json  (Cole 40, 41, 42, 43 -> index y cole-43)
#   (Cole 44 queda manual, no se toca)
# Despues corre conectar-fotos.js: los modelos 40-43 con stock y carpeta de fotos en el repo que no estan
# en la pagina quedan conectados solos (foto web liviana + og + ficha en data-catalogo-4X.json).
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

# --- Restar lo que ya esta en cajas (CAJAS.TXT): unidades embaladas para pedidos, no disponibles ---
# El stock real vendible es el SALDO = stock fisico - cajas (asi lo muestra el dashboard ADECOM).
# CAJAS.TXT: Caja;Fecha;Articulo;Pedido;Cant;RUT;Cliente, con Articulo = 01 + modelo(4) + variante(2) + talla(2).
$cajasPath = Join-Path (Split-Path $csvPath -Parent) 'CAJAS.TXT'
$enCajas = @{}   # family -> @{ talla -> unidades }
if (Test-Path $cajasPath) {
    $rc = New-Object System.IO.StreamReader($cajasPath, $enc)
    [void]$rc.ReadLine()
    while ($true) {
        $l = $rc.ReadLine()
        if ($null -eq $l) { break }
        $c = $l -split ';'
        if ($c.Count -lt 5) { continue }
        $a = $c[2].Trim()
        if ($a.Length -lt 10 -or -not $a.StartsWith('01')) { continue }
        $fam = $a.Substring(2, 4) + '-' + $a.Substring(6, 2)
        $tal = $a.Substring(8, 2)
        $n = 0; [void][int]::TryParse(($c[4].Trim() -replace '[^0-9\-]', ''), [ref]$n)
        if ($n -le 0) { continue }
        if (-not $enCajas.ContainsKey($fam)) { $enCajas[$fam] = @{} }
        if (-not $enCajas[$fam].ContainsKey($tal)) { $enCajas[$fam][$tal] = 0 }
        $enCajas[$fam][$tal] += $n
    }
    $rc.Close()
    $restadas = 0
    foreach ($t in $targets) {
        $items = $byTarget[$t.file]
        foreach ($fam in @($items.Keys)) {
            if (-not $enCajas.ContainsKey($fam)) { continue }
            $tot = 0
            foreach ($sz in $sizeNames) {
                $q = if ($enCajas[$fam].ContainsKey($sz)) { [int]$enCajas[$fam][$sz] } else { 0 }
                $v = [int]$items[$fam].sizes[$sz] - $q
                if ($v -lt 0) { $v = 0 }
                $items[$fam].sizes[$sz] = $v
                $tot += $v
            }
            $items[$fam].en_cajas = ($enCajas[$fam].Values | Measure-Object -Sum).Sum
            $items[$fam].total = $tot
            $restadas++
        }
    }
    Write-Output "$(Get-Date -Format 'HH:mm:ss') CAJAS.TXT: $($enCajas.Count) articulos con unidades en cajas; descontados en $restadas registros"
} else {
    Write-Warning "No se encuentra $cajasPath - se publica el stock sin descontar cajas"
}

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

# --- Conectar fotos nuevas a la pagina (conectar-fotos.js) ---
# Modelos con stock y carpeta de fotos que no se muestran: genera la foto web, la portada og y la ficha.
# Imprime "CAMBIO <ruta>" solo por los archivos que el script escribio (nunca cambios hechos a mano).
# Si falla, el stock se publica igual. Con -NoPush no se corre: no deja fotos ni fichas a medio publicar.
Set-Location $repoPath
$fotoFiles = @()
$fotosNuevas = 0
$pendientesFotos = Join-Path $repoPath '.conectar-fotos.pendiente.json'
if ($NoPush) {
    Write-Output "$(Get-Date -Format 'HH:mm:ss') -NoPush: no se conectan fotos nuevas"
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8   # node escribe UTF-8 (rutas y acentos)
        $salida = @(& node (Join-Path $repoPath 'conectar-fotos.js') --apply --desde-sync)
        # Al log van solo las secciones con novedades; la lista "con stock y sin carpeta" se repite en cada corrida y no aporta.
        $seccion = ''
        foreach ($l in $salida) {
            $t = "$l"
            if ($t.StartsWith('CAMBIO ')) { $fotoFiles += $t.Substring(7); continue }
            if ($t -match '^(Fichas nuevas|C.digos corregidos|Fotos republicadas|Tipo/tiro/corte|Ignorados|Con stock y sin carpeta|Errores|Sin fotos nuevas)') {
                $seccion = $Matches[1]
                if ($seccion -notlike 'Con stock*') { Write-Output "$(Get-Date -Format 'HH:mm:ss') fotos: $t" }
                continue
            }
            if ($seccion -ne '' -and $seccion -notlike 'Con stock*' -and $t.StartsWith('  ')) {
                Write-Output "$(Get-Date -Format 'HH:mm:ss') fotos: $t"
                if ($seccion -eq 'Fichas nuevas') { $fotosNuevas++ }
            }
        }
    } catch { Write-Warning "conectar-fotos.js fallo, se publica solo el stock: $_" }
} else {
    Write-Warning "node no esta disponible: no se conectan fotos nuevas (solo stock)"
}
if ($fotoFiles.Count) { $changedFiles += $fotoFiles }

# --- Informe privado de pendientes del catalogo (pendientes-catalogo.js) ---
# Modelos con stock sin foto, sin precio y notas por resolver -> pendientes-catalogo.html en el PC
# (no va a la web: esta en .gitignore). En las corridas de las 8 y de las 17 se manda por Telegram
# como archivo (--avisar) al chat guardado en %USERPROFILE%\.mohicano	elegram.json.
if (-not $NoPush -and (Get-Command node -ErrorAction SilentlyContinue)) {
    try {
        $argsP = @((Join-Path $repoPath 'pendientes-catalogo.js'))
        if ((Get-Date).Hour -eq 8 -or (Get-Date).Hour -eq 17) { $argsP += '--avisar' }
        $salidaP = @(& node $argsP)
        foreach ($l in $salidaP) { Write-Output "$(Get-Date -Format 'HH:mm:ss') $l" }
    } catch { Write-Warning "pendientes-catalogo.js fallo: $_" }
}

# --- Git commit + push ---
Set-Location $repoPath
git add -- $changedFiles
if ($LASTEXITCODE -ne 0) { Write-Output "$(Get-Date -Format 'HH:mm:ss') ERROR en git add (codigo $LASTEXITCODE)"; exit 1 }
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
if ($fotosNuevas -gt 0) { $msg += " + $fotosNuevas modelos con foto nueva en la pagina" }
git commit -q -m $msg -- $changedFiles
if ($LASTEXITCODE -ne 0) { Write-Output "$(Get-Date -Format 'HH:mm:ss') ERROR en git commit (codigo $LASTEXITCODE)"; exit 1 }
git push -q origin main
if ($LASTEXITCODE -eq 0) {
    Write-Output "$(Get-Date -Format 'HH:mm:ss') Push a Netlify OK"
    # Las fotos ya estan publicadas: la lista de pendientes se borra (si el push falla, la corrida siguiente las vuelve a subir)
    if (Test-Path $pendientesFotos) { Remove-Item $pendientesFotos -Force -ErrorAction SilentlyContinue }
}
else { Write-Output "$(Get-Date -Format 'HH:mm:ss') ERROR en push (codigo $LASTEXITCODE)"; exit 1 }

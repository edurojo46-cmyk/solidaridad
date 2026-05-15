# fix_double_utf8.ps1
# Repara el doble encoding UTF-8 en index.html y app.js
# Los acentos como 'i con acento' fueron doble-codificados:
# bytes originales: C3 AD (UTF-8 de í)
# leidos como Latin-1 y re-codificados: C3 83 C2 AD

param(
    [string[]]$Files = @(
        'c:\Users\Eduardo\Desktop\solidaridad\index.html',
        'c:\Users\Eduardo\Desktop\solidaridad\app.js'
    )
)

# Mapa: secuencia doble-encoded (como bytes) -> caracter correcto UTF-8
# Leemos el archivo como Latin-1, reemplazamos, luego guardamos como UTF-8
$repairs = @(
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xAD; To = 'í' },   # í
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB3; To = 'ó' },   # ó
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA1; To = 'á' },   # á
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA9; To = 'é' },   # é
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBA; To = 'ú' },   # ú
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB1; To = 'ñ' },   # ñ
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0x93; To = 'Ó' },   # Ó
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0x81; To = 'Á' },   # Á
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0x89; To = 'É' },   # É
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0x9A; To = 'Ú' },   # Ú
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0x91; To = 'Ñ' },   # Ñ
    @{ From = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBC; To = 'ü' },   # ü
    # Single-level corruption (Ã¡ etc.) - also fix these
    @{ From = [char]0xC3 + [char]0xAD; To = 'í' },   # Ã­
    @{ From = [char]0xC3 + [char]0xB3; To = 'ó' },   # Ã³
    @{ From = [char]0xC3 + [char]0xA1; To = 'á' },   # Ã¡
    @{ From = [char]0xC3 + [char]0xA9; To = 'é' },   # Ã©
    @{ From = [char]0xC3 + [char]0xBA; To = 'ú' },   # Ãº
    @{ From = [char]0xC3 + [char]0xB1; To = 'ñ' },   # Ã±
    @{ From = [char]0xC3 + [char]0x93; To = 'Ó' },   # Ã"
    @{ From = [char]0xC3 + [char]0x81; To = 'Á' },   # Ã
    @{ From = [char]0xC3 + [char]0x89; To = 'É' },   # Ã‰
    @{ From = [char]0xC3 + [char]0x9A; To = 'Ú' },   # Ãš
    @{ From = [char]0xC3 + [char]0x91; To = 'Ñ' },   # Ã'
    @{ From = [char]0xC3 + [char]0xBC; To = 'ü' }    # Ã¼
)

foreach ($filePath in $Files) {
    if (-not (Test-Path $filePath)) {
        Write-Host "SKIP: $filePath (not found)"
        continue
    }
    
    Write-Host "`nProcessing: $(Split-Path $filePath -Leaf)"
    
    # Read as raw bytes
    $rawBytes = [System.IO.File]::ReadAllBytes($filePath)
    
    # Convert to Latin-1 string (byte-preserving)
    $latin1 = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($rawBytes)
    
    $totalFixes = 0
    foreach ($r in $repairs) {
        $before = $latin1
        # Simple string replace
        $latin1 = $latin1.Replace($r.From, $r.To)
        $fixCount = ($before.Length - $latin1.Length) / ($r.From.Length - $r.To.Length)
        if ($fixCount -gt 0) {
            Write-Host "  Fixed -> '$($r.To)' ($fixCount times)"
            $totalFixes += $fixCount
        }
    }
    
    Write-Host "  Total fixes: $totalFixes"
    
    # Backup original
    $bkp = $filePath + '.bkp.fix_enc2'
    [System.IO.File]::Copy($filePath, $bkp, $true)
    
    # Write back as UTF-8 (without BOM)
    $outBytes = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetBytes($latin1)
    [System.IO.File]::WriteAllBytes($filePath, $outBytes)
    
    Write-Host "  Saved (backup: $(Split-Path $bkp -Leaf))"
    Write-Host "  OK: $(Split-Path $filePath -Leaf)"
}

Write-Host "`nDone!"

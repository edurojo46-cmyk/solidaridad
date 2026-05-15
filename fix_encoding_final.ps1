
$bytes = [System.IO.File]::ReadAllBytes("index.html")
# Check BOM: UTF-16 LE = FF FE, UTF-8 BOM = EF BB BF
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    Write-Host "DETECTED: UTF-16 LE - converting to UTF-8..."
    $text = [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
    Write-Host "DONE. Saved as UTF-8 without BOM."
} elseif ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "DETECTED: UTF-8 with BOM - removing BOM..."
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
    Write-Host "DONE. Saved as UTF-8 without BOM."
} else {
    Write-Host "File appears to be UTF-8 already."
}
$newBytes = [System.IO.File]::ReadAllBytes("index.html")
Write-Host "New file size:" $newBytes.Length "bytes"
Write-Host "First 4 bytes:" $newBytes[0] $newBytes[1] $newBytes[2] $newBytes[3]


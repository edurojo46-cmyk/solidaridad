
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $text -split "`n"

# Find visible text lines with Mojibake (not code)
$count = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if (($line -match "Ã�|á|ó|é|í|ñ") -and ($line -notmatch "var |function |console\.|if \(|return|//")) {
        $count++
        if ($count -le 20) {
            Write-Host "Line $($i+1): $line"
        }
    }
}
Write-Host "Total visible Mojibake lines: $count"



$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $text -split "`n"

# Find lines with typical Mojibake sequences
$count = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "ÃƒÂ|ÃÂ|AÂ|a|â€™|Ã¡|Ã³|Ã©|Ã­|Ã±") {
        $count++
        if ($count -le 20) {
            Write-Host "Line $($i+1): $line"
        }
    }
}
Write-Host "Total lines with Mojibake: $count"


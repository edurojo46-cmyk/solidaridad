
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find the big garbage block - sequence starting with char 195, 402
# Look for a large repeated pattern
$idx = $text.IndexOf("Unete a SOLIDARIDAD")
if ($idx -lt 0) { $idx = $text.IndexOf("nete a SOLIDARIDAD") }
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 200)
    $sample = $text.Substring($start, [Math]::Min(300, $text.Length - $start))
    Write-Host "Before nete: [$sample]"
}


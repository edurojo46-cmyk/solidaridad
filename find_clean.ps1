
$bytes = [System.IO.File]::ReadAllBytes("original_index_utf8.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$idx = $text.IndexOf("nete a SOLIDARIDAD")
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 50)
    $sample = $text.Substring($start, [Math]::Min(100, $text.Length - $start))
    Write-Host "Clean: [$sample]"
}


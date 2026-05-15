
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Look for "Contrase" to find the password field
$idx = $text.IndexOf("Contrase")
if ($idx -ge 0) {
    $sample = $text.Substring($idx, [Math]::Min(30, $text.Length - $idx))
    Write-Host "Sample: [$sample]"
    $codes = ""
    for ($j = $idx; $j -lt [Math]::Min($idx+15, $text.Length); $j++) {
        $codes += [int][char]$text[$j]
        $codes += " "
    }
    Write-Host "Char codes: $codes"
}


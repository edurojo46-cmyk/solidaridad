
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Search for the specific corrupted character U+01DF
$char01df = [char]0x01DF
$idx = $text.IndexOf($char01df)
Write-Host "U+01DF (a) first found at: $idx"

if ($idx -ge 0) {
    $sample = $text.Substring([Math]::Max(0, $idx), [Math]::Min(20, $text.Length - $idx))
    Write-Host "Sample from there: [$sample]"
    
    $codes = ""
    for ($j = $idx; $j -lt [Math]::Min($idx+8, $text.Length); $j++) {
        $codes += [int][char]$text[$j]
        $codes += " "
    }
    Write-Host "Char codes: $codes"
}


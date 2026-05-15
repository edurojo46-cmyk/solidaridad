
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$p = [char]195 + [char]402 + [char]194 + [char]162

$idx = $text.IndexOf($p)
if ($idx -ge 0) {
    $sample = $text.Substring([Math]::Max(0, $idx-10), [Math]::Min(40, $text.Length - $idx))
    Write-Host "Context: [$sample]"
    $codes = ""
    for ($j = [Math]::Max(0, $idx-2); $j -lt [Math]::Min($idx+10, $text.Length); $j++) {
        $codes += [int][char]$text[$j]
        $codes += " "
    }
    Write-Host "Codes: $codes"
}
Write-Host "Total count: $(([regex]::Matches($text, [regex]::Escape($p))).Count)"



$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find the first a and print surrounding bytes
$idx = $text.IndexOf("a")
if ($idx -ge 0) {
    $sample = $text.Substring([Math]::Max(0, $idx-3), [Math]::Min(30, $text.Length - $idx))
    Write-Host "Found a at char position $idx"
    Write-Host "Sample: $sample"
    
    # Print the char codes around it
    $codes = ""
    for ($j = [Math]::Max(0, $idx-2); $j -lt [Math]::Min($idx+10, $text.Length); $j++) {
        $codes += [int][char]$text[$j]
        $codes += " "
    }
    Write-Host "Char codes: $codes"
}

# Also find a followed by something specific
$match = [regex]::Match($text, "a(.{1,4})n")
if ($match.Success) {
    Write-Host "Pattern aXXn found"
    $between = $match.Groups[1].Value
    $codes = ""
    foreach ($ch in $between.ToCharArray()) { $codes += [int]$ch; $codes += " " }
    Write-Host "Between chars: [$between] codes: $codes"
}


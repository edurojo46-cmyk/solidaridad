
$bytes = [System.IO.File]::ReadAllBytes("clean_index.html")
$c = [System.Text.Encoding]::UTF8.GetString($bytes)

$matches = [regex]::Matches($c, "Situaci(.{3})n")
if ($matches.Count -gt 0) {
    $badStr = $matches[0].Groups[1].Value
    Write-Host "The bad string is: " $badStr
    
    $charCodes = ""
    foreach ($char in $badStr.ToCharArray()) {
        $charCodes += [int]$char + " "
    }
    Write-Host "Char codes: $charCodes"
}


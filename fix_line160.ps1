
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Fix the stray comma - line 159 has "    }" and line 160 has ","
# The exact bytes are: "    }" + CRLF + "," + CRLF + "        alert:"
$bad = "    }" + "`r`n" + "," + "`r`n" + "        alert: function(title, desc, type) {"
$good = "    }," + "`r`n" + "    alert: function(title, desc, type) {"
if ($text.IndexOf($bad) -ge 0) {
    $text = $text.Replace($bad, $good)
    Write-Host "Fixed stray comma"
} else {
    Write-Host "Pattern not found - trying variant"
    $bad2 = "    }" + "`n" + "," + "`n" + "        alert:"
    if ($text.IndexOf($bad2) -ge 0) {
        Write-Host "Found with LF only"
    }
    
    # Let us try byte-level search
    $lines = $text -split "`n"
    for ($i = 158; $i -lt 163; $i++) {
        $codes = ""
        foreach ($c in $lines[$i].ToCharArray()) { $codes += [int]$c; $codes += " " }
        Write-Host "Line $($i+1): [$($lines[$i])] codes=[$codes]"
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved."


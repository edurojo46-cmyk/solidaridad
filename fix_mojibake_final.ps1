
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# The triple-encoded chars appear as: char(195) + char(402) + char(194) + char(X)
# where char(195)=C3, char(402)=U+0192=ƒ, char(194)=C2
# Map: X=169=a9=© -> no; X=161=0xa1=? -> a; X=169=0xa9 -> ?

# Build the bad prefixes
$bad_prefix = [char]195 + [char]402 + [char]194

# Map of suffix -> correct char
$map = @{
    [char]161 = "á"   # 0xA1
    [char]169 = "é"   # 0xA9  
    [char]173 = "í"   # 0xAD
    [char]179 = "ó"   # 0xB3
    [char]186 = "ú"   # 0xBA
    [char]177 = "ñ"   # 0xB1
    [char]129 = "Á"   # 0x81
    [char]137 = "É"   # 0x89
    [char]141 = "Í"   # 0x8D
    [char]147 = "Ó"   # 0x93
    [char]154 = "Ú"   # 0x9A
    [char]145 = "Ñ"   # 0x91
    [char]188 = "ü"   # 0xBC
    [char]182 = "ö"   # 0xB6
    [char]164 = "ä"   # 0xA4
    [char]181 = "õ"   # 0xB5
    [char]163 = "ã"   # 0xA3
    [char]167 = "ç"   # 0xA7
    [char]176 = "°"   # 0xB0
    [char]183 = "·"   # 0xB7
    [char]191 = "¿"   # 0xBF
    [char]161 = "á"   # (repeat to ensure both are in map)
}

$beforeCount = ($text | Select-String -AllMatches -Pattern ([regex]::Escape($bad_prefix))).Matches.Count

foreach ($suffix in $map.Keys) {
    $bad = $bad_prefix + $suffix
    $good = $map[$suffix]
    $count = 0
    while ($text.IndexOf($bad) -ge 0) {
        $text = $text.Replace($bad, $good)
        $count++
    }
    if ($count -gt 0) { Write-Host "Replaced [$bad] -> [$good] ($count times)" }
}

$afterCount = ($text | Select-String -AllMatches -Pattern ([regex]::Escape($bad_prefix))).Matches.Count
Write-Host "Before: $beforeCount bad patterns. After: $afterCount bad patterns."

# Save back as UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved."


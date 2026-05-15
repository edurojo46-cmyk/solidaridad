
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Build the bad prefix: char(195) + char(402) + char(194)  
# Note: char(402) = U+0192 (latin small letter f with hook = ƒ)
$p = [char]195
$f = [char]402
$c = [char]194

$total = 0

function Fix($t, $suffix, $good) {
    $bad = [char]195 + [char]402 + [char]194 + [char]$suffix
    $count = 0
    while ($t.IndexOf($bad) -ge 0) {
        $t = $t.Replace($bad, $good)
        $count++
    }
    if ($count -gt 0) { Write-Host "Replaced suffix $suffix -> $good ($count times)" }
    return $t
}

$text = Fix $text 161 "a"   # a-acute
$text = Fix $text 169 "e"   # e-acute  
$text = Fix $text 173 "i"   # i-acute
$text = Fix $text 179 "o"   # o-acute
$text = Fix $text 186 "u"   # u-acute
$text = Fix $text 177 "n"   # n-tilde
$text = Fix $text 129 "A"   # A-acute
$text = Fix $text 137 "E"   # E-acute
$text = Fix $text 141 "I"   # I-acute
$text = Fix $text 147 "O"   # O-acute
$text = Fix $text 154 "U"   # U-acute
$text = Fix $text 145 "N"   # N-tilde
$text = Fix $text 188 "u"   # u-umlaut (ü)
$text = Fix $text 182 "o"   # o-umlaut (ö)
$text = Fix $text 164 "a"   # a-umlaut (ä)
$text = Fix $text 176 "o"   # degree sign
$text = Fix $text 183 "·"   # middle dot
$text = Fix $text 191 "?"   # inverted ?

# Write back without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Done."


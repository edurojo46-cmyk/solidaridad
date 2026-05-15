
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# The remaining garbage is sequences of these chars mixed together:
# a (U+01DF=479), ? (U+01FD=509), N (U+0143=323), ? (63)
# They appear as long runs of noise between real content

# Strategy: remove any sequence of 3+ consecutive chars that are all from the garbage set
# Garbage chars: 479 (a), 509 (?), 323 (N), 8364 (€ misread), 353 (š misread)
# Also garbage: the patterns like "a?" which are a followed by certain chars

# Remove long garbage runs (3+ garbage chars in a row)
$garbagePattern = "[a?N\x{8364}\x{353}]+"
$before = [regex]::Matches($text, "a").Count
Write-Host "a count before: $before"

# Remove runs of garbage chars mixed with common mojibake residue
$text = [regex]::Replace($text, "(?:[a?\u0143\u20ac\u0161\u0153\u017e\u017d]{1,}(?:[?'""\x22\s]?[a?\u0143\u20ac\u0161\u0153]{0,})*)", "")

$after = [regex]::Matches($text, "a").Count
Write-Host "a count after: $after"

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved."


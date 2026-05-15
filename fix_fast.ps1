
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$p = [char]195 + [char]402 + [char]194

# All replacements in ONE call using direct [string]::Replace (single pass each)
$text = $text.Replace($p + [char]161, "a")
$text = $text.Replace($p + [char]169, "e")
$text = $text.Replace($p + [char]173, "i")
$text = $text.Replace($p + [char]179, "o")
$text = $text.Replace($p + [char]186, "u")
$text = $text.Replace($p + [char]177, "n")
$text = $text.Replace($p + [char]129, "A")
$text = $text.Replace($p + [char]137, "E")
$text = $text.Replace($p + [char]141, "I")
$text = $text.Replace($p + [char]147, "O")
$text = $text.Replace($p + [char]154, "U")
$text = $text.Replace($p + [char]145, "N")
$text = $text.Replace($p + [char]188, "u")
$text = $text.Replace($p + [char]182, "o")
$text = $text.Replace($p + [char]164, "a")

# Check remaining bad chars
$remaining = [regex]::Matches($text, [regex]::Escape($p)).Count
Write-Host "Remaining bad patterns after fix: $remaining"

# Save back as UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved successfully."


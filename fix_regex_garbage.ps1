
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# The garbage pattern: char195+char402+char194+char162 repeated sequences
# This is the triple-encoding of a UTF-8 2-byte sequence starting with 0xC2 (â range)
# C3 83 C2 A2 = "Ã¢" = â -> this pattern represents em-dash, curly quotes, etc.
# In triple-encoding context: garbled text that should not appear in Spanish HTML
# The big garbage blocks are entirely made of these sequences and should be deleted (not in user-visible content)

# Count occurrences before
$badPattern = [char]195 + [char]402 + [char]194 + [char]162
$countBefore = ([regex]::Matches($text, [regex]::Escape($badPattern))).Count
Write-Host "Bad pattern count before: $countBefore"

# Strategy: the long garbage strings are all within HTML text nodes or attribute values
# Use regex to remove sequences of garbage chars between HTML tags
# Garbage chars: sequence of chars in range 195-402 combined with ASCII punctuation
# Remove garbage-only runs that appear between normal text

# Pattern: any sequence of the specific 4-char bad combo
$text = [regex]::Replace($text, "(?:" + [regex]::Escape($badPattern) + ")+", "")

$countAfter = ([regex]::Matches($text, [regex]::Escape($badPattern))).Count
Write-Host "Bad pattern count after: $countAfter"

# Save
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved."


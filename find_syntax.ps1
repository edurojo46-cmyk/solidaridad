
$lines = Get-Content index.html
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    # Look for obvious issues: lines starting with comma, or "},," patterns
    if ($line -match "^\s*,\s*$" -or $line -match "^,\s" -or $line -match "},,$") {
        Write-Host "Suspect at line $($i+1): $line"
    }
}


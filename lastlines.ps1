
$lines = Get-Content index.html
for ($i = $lines.Count - 25; $i -lt $lines.Count; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}


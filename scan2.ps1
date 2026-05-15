
$lines = Get-Content index.html
for ($i = 9100; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "originalNavigate" -or $line -match "app.navigate") {
        Write-Host "Line $($i+1): $line"
    }
}


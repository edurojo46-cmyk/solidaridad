
$lines = Get-Content index.html
for ($i = 9085; $i -lt 9105; $i++) {
    if ($i -lt $lines.Count) {
        Write-Host "$($i+1): $($lines[$i])"
    }
}



$lines = Get-Content test_index_utf8.html
$startIndex = -1
$endIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "<!-- Chat System — REAL \(Supabase\) -->") {
        $startIndex = $i
    }
    if ($startIndex -ge 0 -and $lines[$i] -match "<!-- FIN CHAT -->") {
        $endIndex = $i
        break
    }
}
Write-Host "Start: $startIndex, End: $endIndex"
if ($startIndex -ge 0) {
    Write-Host "Found Chat System block!"
}



$lines = Get-Content test_index_utf8.html
$startIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match ".msg-conv-view {") {
        $startIndex = $i
        break
    }
}
Write-Host "Start: $startIndex"
if ($startIndex -ge 0) {
    for ($i = $startIndex - 50; $i -lt $startIndex + 250; $i++) {
        if ($i -ge 0 -and $i -lt $lines.Count) {
            $lineStr = $lines[$i]
            Write-Host "$i $lineStr"
        }
    }
}


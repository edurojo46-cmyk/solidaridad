
$lines = Get-Content index.html
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "initRealChat|old chat screen|screen-mensajes|msg-conv-view|chat-view") {
        Write-Host "Line $($i+1): $($lines[$i])"
    }
}


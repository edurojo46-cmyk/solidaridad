
$lines = Get-Content index.html
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "showChatEmpty|chat-empty") {
        Write-Host "Line $($i+1): $($lines[$i])"
    }
}


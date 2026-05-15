
$c = Get-Content index.html -Raw
$startIdx = $c.IndexOf("<div id=""chat-view""")
if ($startIdx -lt 0) { $startIdx = $c.IndexOf("<div id=""msg-conv-view""") }
if ($startIdx -gt 0) {
    Write-Host "Found chat HTML at: $startIdx"
}


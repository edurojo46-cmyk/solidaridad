
$c = Get-Content index.html -Raw
if (-not $c.Contains("chat-pro.js")) {
    $c = $c -replace "</body>", "<script src=""chat-pro.js""></script>`r`n</body>"
    Set-Content index.html $c -Encoding UTF8
    Write-Host "Added chat-pro.js"
}


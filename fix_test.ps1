
$bytes = [System.IO.File]::ReadAllBytes("test_index.html")
# If it has UTF-16 LE BOM (FF FE)
$encoding = [System.Text.Encoding]::Unicode
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    Write-Host "File is UTF-16 LE"
} else {
    Write-Host "File is not UTF-16 LE"
    $encoding = [System.Text.Encoding]::UTF8
}

$c = [System.IO.File]::ReadAllText("test_index.html", $encoding)
$firstHtmlEnd = $c.IndexOf("</html>")
if ($firstHtmlEnd -ge 0) {
    Write-Host "Found </html> at $firstHtmlEnd"
    $cleanHtml = $c.Substring(0, $firstHtmlEnd + 7)
    
    # Append chat-pro.js script
    if (-not $cleanHtml.Contains("chat-pro.js")) {
        $cleanHtml = $cleanHtml -replace "</body>", "<script src=""chat-pro.js""></script>`r`n</body>"
    }
    
    [System.IO.File]::WriteAllText("clean_index.html", $cleanHtml, [System.Text.Encoding]::UTF8)
    Write-Host "Saved clean_index.html as UTF-8, length:" $cleanHtml.Length
}


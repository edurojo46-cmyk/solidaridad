
$c = Get-Content index.html -Raw
$firstHtmlEnd = $c.IndexOf("</html>")
if ($firstHtmlEnd -gt 0) {
    # Include the </html> tag
    $cleanHtml = $c.Substring(0, $firstHtmlEnd + 7)
    
    # Add chat-pro.js before the </body> tag if it does not exist
    if (-not $cleanHtml.Contains("chat-pro.js")) {
        $cleanHtml = $cleanHtml -replace "</body>", "<script src=""chat-pro.js""></script>`r`n</body>"
    }
    
    Set-Content index.html $cleanHtml -Encoding UTF8
    Write-Host "File truncated successfully to size:" $cleanHtml.Length
}



$c = Get-Content test_index_utf8.html -Raw
$matches = [regex]::Matches($c, "</html>")
Write-Host "Number of </html> tags:" $matches.Count
$firstHtmlEnd = $c.IndexOf("</html>")
Write-Host "First </html> at:" $firstHtmlEnd


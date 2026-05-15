
$c = Get-Content temp.js -Raw
Write-Host "Index of </html>:" $c.IndexOf("</html>")
Write-Host "Last index of </html>:" $c.LastIndexOf("</html>")



$content = Get-Content index.html -Raw
$matches = [regex]::Matches($content, "</body>")
Write-Host "Found </body> at indices:"
foreach ($m in $matches) { Write-Host $m.Index }


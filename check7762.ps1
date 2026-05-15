
$c = Get-Content index.html -Raw
Write-Host $c.Substring(7700, 200)


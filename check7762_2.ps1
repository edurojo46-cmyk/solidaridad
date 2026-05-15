
$c = Get-Content index.html -Raw
Write-Host $c.Substring(7400, 500)


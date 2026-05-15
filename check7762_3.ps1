
$c = Get-Content index.html -Raw
Write-Host $c.Substring(6000, 1000)



$c = Get-Content index.html -Raw
Write-Host $c.IndexOf("// Fallback: Guarantee sync every 5 seconds")


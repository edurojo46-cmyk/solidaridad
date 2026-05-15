
$c = Get-Content index.html -Raw
$matches = [regex]::Matches($c, "Iniciá|Ã¡")
Write-Host "Corrupted accent strings in chat auth messages: " $matches.Count


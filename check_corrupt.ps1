
$c = Get-Content index.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions:" $matches.Count


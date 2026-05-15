
$c = Get-Content temp.js -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions in temp.js:" $matches.Count


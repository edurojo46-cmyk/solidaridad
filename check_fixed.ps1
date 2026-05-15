
$c = Get-Content fixed_test.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions in fixed_test.html:" $matches.Count


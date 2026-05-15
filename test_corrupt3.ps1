
$c = Get-Content test_index.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions in test_index.html:" $matches.Count


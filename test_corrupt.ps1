
$c = Get-Content test_index_utf8.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions:" $matches.Count


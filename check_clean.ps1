
$c = Get-Content clean_index.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions in clean_index.html:" $matches.Count


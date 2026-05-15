
$c = Get-Content final_index.html -Raw
$matches = [regex]::Matches($c, "a")
Write-Host "Number of corruptions in final_index.html:" $matches.Count



$c = Get-Content test_index_utf8.html -Raw
$c1 = $c.Substring(0, 686222)
$matches = [regex]::Matches($c1, "a")
Write-Host "Number of corruptions before </html>:" $matches.Count


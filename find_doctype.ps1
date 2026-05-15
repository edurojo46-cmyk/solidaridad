
$c = Get-Content index.html -Raw
$matches = [regex]::Matches($c, "<!DOCTYPE html>")
foreach ($m in $matches) { Write-Host $m.Index }


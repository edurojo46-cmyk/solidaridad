
$c = Get-Content temp.js -Raw
if ($c.Contains("screen-Comedores")) { Write-Host "Comedores YES" } else { Write-Host "Comedores NO" }


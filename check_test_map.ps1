
$c = Get-Content test_index.html -Raw
if ($c.Contains("initComedoresGlobalMap")) { Write-Host "MAP_YES" } else { Write-Host "MAP_NO" }


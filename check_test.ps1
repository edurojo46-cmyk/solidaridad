
$c = Get-Content test_index.html -Raw
if ($c.Contains("msg-conv-view")) { Write-Host "YES" } else { Write-Host "NO" }


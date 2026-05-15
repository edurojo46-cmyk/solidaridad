
$content = Get-Content index.html -Raw
$matches = [regex]::Matches($content, "alert: function\(title, desc, type\)")
Write-Host "Found alert at indices:"
foreach ($m in $matches) { Write-Host $m.Index }


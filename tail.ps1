
$c = Get-Content index_backup_before_encoding.html -Raw
Write-Host $c.Substring($c.Length - 1000)


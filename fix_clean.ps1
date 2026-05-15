
$c = Get-Content clean_index.html -Raw
$c = $c.Replace("a'N?T", "í")
$c = $c.Replace("a?s'", "ó")
$c = $c.Replace("a'?'", "á")
$c = $c.Replace("a??s.?o", "ñ")
$c = $c.Replace("a''", "é")
$c = $c.Replace("a?''", "ú")
$c = $c.Replace("a'??s.?o", "Á")
$c = $c.Replace("a'N?S", "Í")

# General ones that might be in there without the 
$c = $c.Replace("a'N?T", "í")
$c = $c.Replace("a?s'", "ó")
$c = $c.Replace("a'?'", "á")
$c = $c.Replace("a??s.?o", "ñ")
$c = $c.Replace("a''", "é")
$c = $c.Replace("a?''", "ú")

$matches = [regex]::Matches($c, "a")
Write-Host "Remaining corruptions:" $matches.Count

Set-Content final_index.html $c -Encoding UTF8


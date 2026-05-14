$src = "C:\Users\Eduardo\Desktop\solidaridad\index.html"
$lines = Select-String 'id="screen-' $src | % { $_.Line.Trim() }
Write-Output $lines

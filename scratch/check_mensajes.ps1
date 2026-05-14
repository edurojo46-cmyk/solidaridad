$c = [System.IO.File]::ReadAllText('C:\Users\Eduardo\Desktop\solidaridad\index.html')
$s = $c.IndexOf('<section id="screen-mensajes"')
if ($s -ge 0) {
    Write-Output $c.Substring($s, 800)
}

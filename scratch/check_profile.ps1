$c = [System.IO.File]::ReadAllText('C:\Users\Eduardo\Desktop\solidaridad\index.html')
$p = $c.IndexOf('<section id="screen-profile"')
if ($p -gt -1) {
    $start = [Math]::Max(0, $p - 800)
    Write-Output $c.Substring($start, 1000)
}

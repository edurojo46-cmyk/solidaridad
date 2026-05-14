$destHtmlPath = "C:\Users\Eduardo\Desktop\solidaridad\index.html"
$destContent = [System.IO.File]::ReadAllText($destHtmlPath)
$destContent = $destContent.Replace('app.navigate(''screen-chat'')', 'app.navigate(''screen-mensajes'')')
$destContent = $destContent.Replace('app.mobileNav(''screen-chat'')', 'app.mobileNav(''screen-mensajes'')')
[System.IO.File]::WriteAllText($destHtmlPath, $destContent, [System.Text.Encoding]::UTF8)
Write-Host "Nav fixed!"

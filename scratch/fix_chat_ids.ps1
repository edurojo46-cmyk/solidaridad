$destCssPath = "C:\Users\Eduardo\Desktop\solidaridad\index.css"
$destCss = [System.IO.File]::ReadAllText($destCssPath)
if ($destCss.Contains('CHAT (WhatsApp Style)')) {
    $destCss = $destCss.Replace('screen-chat', 'screen-mensajes')
    [System.IO.File]::WriteAllText($destCssPath, $destCss, [System.Text.Encoding]::UTF8)
    Write-Host "CSS Fixed!"
}

$destJsPath = "C:\Users\Eduardo\Desktop\solidaridad\app.js"
$destJs = [System.IO.File]::ReadAllText($destJsPath)
if ($destJs.Contains('CHAT JS LOGIC')) {
    $destJs = $destJs.Replace('screen-chat', 'screen-mensajes')
    [System.IO.File]::WriteAllText($destJsPath, $destJs, [System.Text.Encoding]::UTF8)
    Write-Host "JS Fixed!"
}

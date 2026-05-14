$srcHtmlPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\index.html"
$destHtmlPath = "C:\Users\Eduardo\Desktop\solidaridad\index.html"

# Extract Chat HTML from solidaridad-nuevo
$srcContent = [System.IO.File]::ReadAllText($srcHtmlPath)
$chatStart = $srcContent.IndexOf('<section id="screen-chat"')
if ($chatStart -gt -1) {
    $chatEnd = $srcContent.IndexOf('</section>', $chatStart) + 10
    $chatHtml = $srcContent.Substring($chatStart, $chatEnd - $chatStart)
    $chatHtml = $chatHtml.Replace('id="screen-chat"', 'id="screen-mensajes"')
    
    # Replace old screen-mensajes in solidaridad
    $destContent = [System.IO.File]::ReadAllText($destHtmlPath)
    $oldStart = $destContent.IndexOf('<section id="screen-mensajes"')
    if ($oldStart -gt -1) {
        $oldEnd = $destContent.IndexOf('</section>', $oldStart) + 10
        $destContent = $destContent.Remove($oldStart, $oldEnd - $oldStart)
        $destContent = $destContent.Insert($oldStart, $chatHtml)
        [System.IO.File]::WriteAllText($destHtmlPath, $destContent, [System.Text.Encoding]::UTF8)
        Write-Host "HTML Chat injected over old screen-mensajes!"
    }
}

# CSS
$srcCssPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\index.css"
$destCssPath = "C:\Users\Eduardo\Desktop\solidaridad\index.css"
$srcCss = [System.IO.File]::ReadAllText($srcCssPath)
$cssStartIndex = $srcCss.IndexOf('/* ==================== CHAT (WhatsApp Style) ==================== */')
if ($cssStartIndex -gt -1) {
    $chatCss = $srcCss.Substring($cssStartIndex)
    $chatCss = $chatCss.Replace('screen-chat', 'screen-mensajes')
    $destCss = [System.IO.File]::ReadAllText($destCssPath)
    if (-not $destCss.Contains('CHAT (WhatsApp Style)')) {
        $destCss = $destCss + "`r`n`r`n" + $chatCss
        [System.IO.File]::WriteAllText($destCssPath, $destCss, [System.Text.Encoding]::UTF8)
        Write-Host "CSS Chat injected!"
    }
}

# JS
$srcJsPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\app.js"
$destJsPath = "C:\Users\Eduardo\Desktop\solidaridad\app.js"
$srcJs = [System.IO.File]::ReadAllText($srcJsPath)
$jsStartIndex = $srcJs.IndexOf('// ==================== CHAT JS LOGIC ====================')
if ($jsStartIndex -gt -1) {
    $chatJs = $srcJs.Substring($jsStartIndex)
    $chatJs = $chatJs.Replace('screen-chat', 'screen-mensajes')
    $destJs = [System.IO.File]::ReadAllText($destJsPath)
    if (-not $destJs.Contains('CHAT JS LOGIC')) {
        $destJs = $destJs + "`r`n`r`n" + $chatJs
        [System.IO.File]::WriteAllText($destJsPath, $destJs, [System.Text.Encoding]::UTF8)
        Write-Host "JS Chat injected!"
    }
}

$srcHtmlPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\index.html"
$destHtmlPath = "C:\Users\Eduardo\Desktop\solidaridad\index.html"

# Extract Chat HTML
$srcContent = [System.IO.File]::ReadAllText($srcHtmlPath)
$startIndex = $srcContent.IndexOf('<section id="screen-chat"')
if ($startIndex -gt -1) {
    $endStr = "</section>`r`n    <section id=""screen-profile"""
    $endIndex = $srcContent.IndexOf($endStr, $startIndex)
    if ($endIndex -gt -1) {
        $chatHtml = $srcContent.Substring($startIndex, $endIndex - $startIndex + 10) # Includes </section>
        
        $destContent = [System.IO.File]::ReadAllText($destHtmlPath)
        if (-not $destContent.Contains('id="screen-chat"')) {
            $insertPos = $destContent.IndexOf('<section id="screen-profile"')
            if ($insertPos -gt -1) {
                $destContent = $destContent.Insert($insertPos, $chatHtml + "`r`n    ")
                [System.IO.File]::WriteAllText($destHtmlPath, $destContent, [System.Text.Encoding]::UTF8)
                Write-Host "HTML Chat injected!"
            }
        }
    }
}

# Nav Links
$navLink1 = '<a href="#" class="nav-item" onclick="app.navigate(''screen-chat'')" id="nav-chat-item"><i class="ri-chat-3-line"></i><span>Mensajes</span><span class="nav-msg-badge" id="bottom-msg-badge" style="display:none">0</span></a>'
$destContent = [System.IO.File]::ReadAllText($destHtmlPath)
if (-not $destContent.Contains('id="nav-chat-item"')) {
    $navPos = $destContent.IndexOf('<a href="#" class="nav-item" onclick="app.navigate(''screen-profile'')">')
    if ($navPos -gt -1) {
        $destContent = $destContent.Insert($navPos, $navLink1 + "`r`n            ")
        [System.IO.File]::WriteAllText($destHtmlPath, $destContent, [System.Text.Encoding]::UTF8)
        Write-Host "Nav Chat injected!"
    }
}

# CSS
$srcCssPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\index.css"
$destCssPath = "C:\Users\Eduardo\Desktop\solidaridad\index.css"
$srcCss = [System.IO.File]::ReadAllText($srcCssPath)
$cssStartIndex = $srcCss.IndexOf('/* ==================== CHAT (WhatsApp Style) ==================== */')
if ($cssStartIndex -gt -1) {
    $chatCss = $srcCss.Substring($cssStartIndex)
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
    $destJs = [System.IO.File]::ReadAllText($destJsPath)
    if (-not $destJs.Contains('CHAT JS LOGIC')) {
        $destJs = $destJs + "`r`n`r`n" + $chatJs
        [System.IO.File]::WriteAllText($destJsPath, $destJs, [System.Text.Encoding]::UTF8)
        Write-Host "JS Chat injected!"
    }
}

# Supabase JS
$srcSupaPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\supabase.js"
$destSupaPath = "C:\Users\Eduardo\Desktop\solidaridad\supabase.js"
$srcSupa = [System.IO.File]::ReadAllText($srcSupaPath)
$destSupa = [System.IO.File]::ReadAllText($destSupaPath)
if (-not $destSupa.Contains('searchUsersGlobal')) {
    [System.IO.File]::WriteAllText($destSupaPath, $srcSupa, [System.Text.Encoding]::UTF8)
    Write-Host "Supabase JS replaced!"
}

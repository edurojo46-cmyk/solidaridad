
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# ---- FIX 1: stray comma on line 160 ----
# pattern: ends with "    }\r\n,\r\n" at the prompt() close
$old1 = "        });" + "`r`n" + "    }" + "`r`n" + "," + "`r`n" + "    alert: function(title, desc, type) {"
$new1 = "        });" + "`r`n" + "    }," + "`r`n" + "    alert: function(title, desc, type) {"
if ($text.IndexOf($old1) -ge 0) {
    $text = $text.Replace($old1, $new1)
    Write-Host "Fix 1 applied (stray comma after prompt)"
} else {
    Write-Host "Fix 1: pattern not found"
}

# ---- FIX 2: broken app.navigate at line 9181 ----
# The broken version has:  "    }\r\n,\r\n        alert:" inside app.navigate
$old2 = "    if (targetId === " + [char]39 + "screen-profile" + [char]39 + ") {" + "`r`n" + "        setTimeout(loadSolidaridadProfile, 100);" + "`r`n" + "    }" + "`r`n" + ","
$new2 = "    if (targetId === " + [char]39 + "screen-profile" + [char]39 + ") {" + "`r`n" + "        setTimeout(loadSolidaridadProfile, 100);" + "`r`n" + "    }" + "`r`n" + "};"
if ($text.IndexOf($old2) -ge 0) {
    # Need to find and remove everything between "    }," and the next "    }" after the broken dialog code
    # Find the broken section
    $idx = $text.IndexOf($old2)
    Write-Host "Fix 2: Found broken app.navigate at char $idx"
    # Find end of the broken block - look for the closing "}" of confirm, then "};`r`n</script>"
    $endMark = "        });" + "`r`n" + "    }" + "`r`n" + "};"
    $endIdx = $text.IndexOf($endMark, $idx)
    if ($endIdx -ge 0) {
        # Replace everything from old2 to endMark (inclusive) with just the clean close
        $closeBlock = "    if (targetId === " + [char]39 + "screen-profile" + [char]39 + ") {" + "`r`n" + "        setTimeout(loadSolidaridadProfile, 100);" + "`r`n" + "    }" + "`r`n" + "};"
        $badBlock = $text.Substring($idx, $endIdx + $endMark.Length - $idx)
        $text = $text.Replace($badBlock, $closeBlock)
        Write-Host "Fix 2 applied: removed duplicate dialog block, total" $badBlock.Length "chars"
    } else {
        Write-Host "Fix 2: endMark not found after old2"
    }
} else {
    Write-Host "Fix 2: old2 not found"
}

# ---- FIX 3: guard in _initRealChatInner ----
$old3 = "if (!document.getElementById(" + [char]39 + "chat-contacts-list" + [char]39 + ")) {"
$new3 = "if (!document.getElementById(" + [char]39 + "msg-list-container" + [char]39 + ")) {"
if ($text.IndexOf($old3) -ge 0) {
    $text = $text.Replace($old3, $new3)
    Write-Host "Fix 3 applied (guard updated)"
}

# ---- FIX 4: showChatEmpty corrupted strings ----
$text = $text.Replace("IniciÃƒÂ¡ SesiÃƒÂ³n para chatear", "Iniciá Sesión para chatear")
$text = $text.Replace("Error creando perfil. IntentÃƒÂ¡ de nuevo.", "Error creando perfil. Intentá de nuevo.")
$text = $text.Replace("Error de conexiÃƒÂ³n. IntentÃƒÂ¡ de nuevo.", "Error de conexión. Intentá de nuevo.")

# ---- FIX 5: chat-contacts-list -> msg-list-container in renderContactList ----
$text = $text.Replace("getElementById(" + [char]39 + "chat-contacts-list" + [char]39 + ")", "getElementById(" + [char]39 + "msg-list-container" + [char]39 + ")")
$text = $text.Replace("getElementById(" + [char]39 + "chat-loading" + [char]39 + ")", "getElementById(" + [char]39 + "msg-list-loading" + [char]39 + ")")

# ---- FIX 6: add chat-empty div if missing ----
$chatEmptyDiv = "                <div id=" + [char]34 + "chat-empty" + [char]34 + " style=" + [char]34 + "display:none;text-align:center;padding:60px 20px;" + [char]34 + ">" + "`r`n" + "                    <i class=" + [char]34 + "ri-chat-off-line" + [char]34 + " style=" + [char]34 + "font-size:3rem;color:#cbd5e1;display:block;margin-bottom:12px;" + [char]34 + "></i>" + "`r`n" + "                    <h4 style=" + [char]34 + "color:#64748b;font-weight:700;font-size:1rem;margin:0 0 6px;" + [char]34 + ">Iniciá Sesión para chatear</h4>" + "`r`n" + "                    <p style=" + [char]34 + "color:#94a3b8;font-size:0.85rem;margin:0;" + [char]34 + ">Conectate para ver tus mensajes</p>" + "`r`n" + "                </div>"

if ($text.IndexOf("id=" + [char]34 + "chat-empty" + [char]34) -lt 0) {
    $oldLoadingDiv = "                <div id=" + [char]34 + "msg-list-loading" + [char]34
    $loadingIdx = $text.IndexOf($oldLoadingDiv)
    if ($loadingIdx -ge 0) {
        # Find the end of the loading div  
        $loadingEndMark = "                </div>" + "`r`n" + "            </div>"
        $loadingEndIdx = $text.IndexOf($loadingEndMark, $loadingIdx)
        if ($loadingEndIdx -ge 0) {
            $insertPoint = $loadingEndIdx + "                </div>".Length
            $text = $text.Substring(0, $insertPoint) + "`r`n" + $chatEmptyDiv + $text.Substring($insertPoint)
            Write-Host "Fix 6 applied: chat-empty div inserted"
        }
    }
} else {
    Write-Host "Fix 6: chat-empty already exists"
}

# ---- FIX 7: update showChatEmpty to use new IDs ----
$oldShowChatEmpty = "function showChatEmpty(msg) {" + "`r`n" + "    var loading = document.getElementById(" + [char]39 + "chat-loading" + [char]39 + ");"
$newShowChatEmpty = "function showChatEmpty(msg) {" + "`r`n" + "    var loading = document.getElementById(" + [char]39 + "msg-list-loading" + [char]39 + ");"
if ($text.IndexOf($oldShowChatEmpty) -ge 0) {
    $text = $text.Replace($oldShowChatEmpty, $newShowChatEmpty)
    Write-Host "Fix 7 applied: showChatEmpty updated"
}

# ---- FIX 8: fix chat-loading reference after user ID detection ----
$text = $text.Replace("getElementById(" + [char]39 + "chat-loading" + [char]39 + ");", "getElementById(" + [char]39 + "msg-list-loading" + [char]39 + ");")

# ---- FIX 9: fix msg-list-loading in renderContactList ----
$text = $text.Replace("getElementById(" + [char]39 + "chat-loading" + [char]39 + ")", "getElementById(" + [char]39 + "msg-list-loading" + [char]39 + ")")

Write-Host "All fixes applied."

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved. Size:" (Get-Item "index.html").Length


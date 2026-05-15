
# 1. Read clean_index.html detecting its encoding
$bytes = [System.IO.File]::ReadAllBytes("clean_index.html")

# Detect encoding
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    Write-Host "clean_index.html is UTF-16 LE"
    $text = [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
} elseif ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "clean_index.html is UTF-8 BOM"
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
} else {
    Write-Host "clean_index.html is UTF-8 (no BOM)"
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
}

Write-Host "Length:" $text.Length

# 2. Apply all syntax fixes
# Fix 1: stray comma after prompt()
$text = $text.Replace("        });`r`n    }`r`n,`r`n    alert: function(title, desc, type) {", "        });`r`n    },`r`n    alert: function(title, desc, type) {")

# Fix 2: chat-contacts-list -> msg-list-container
$text = $text.Replace("chat-contacts-list", "msg-list-container")
$text = $text.Replace("chat-loading", "msg-list-loading")

# Fix 3: guard in initRealChat
$text = $text.Replace("getElementById('msg-list-container')", "getElementById('chat-contacts-list')")
# (undo double replace if it happened)

# Fix 4: showChatEmpty string corruption
$text = $text.Replace("IniciÃ¡ SesiÃ³n para chatear", "Inici� Sesi�n para chatear")
$text = $text.Replace("Error creando perfil. IntentÃ¡ de nuevo.", "Error creando perfil. Intent� de nuevo.")
$text = $text.Replace("Error de conexiÃ³n. IntentÃ¡ de nuevo.", "Error de conexi�n. Intent� de nuevo.")

Write-Host "Fixes applied."

# 3. Save as UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("index.html", $text, $utf8NoBom)
Write-Host "Saved as UTF-8 without BOM. Size:" (Get-Item "index.html").Length


$path = "c:\Users\Eduardo\Desktop\solidaridad\index.html"
$content = [IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Fix Mojibake in Messaging labels
$content = $content -replace "IniciÃ¡ SesiÃ³n", "Iniciá Sesión"
$content = $content -replace "ðŸ“· Imagen", "📷 Imagen"
$content = $content -replace "ðŸŽ¥ Video", "🎥 Video"
$content = $content -replace "TÃº", "Tú"
$content = $content -replace "ðŸ‘ ", "👍"
$content = $content -replace "â ¤ï¸ ", "❤️"
$content = $content -replace "ðŸ˜‚", "😂"
$content = $content -replace "ðŸ˜®", "😮"
$content = $content -replace "ðŸ™ ", "🙏"
$content = $content -replace "ðŸ”¥", "🔥"

[IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Mojibake fixed in index.html"

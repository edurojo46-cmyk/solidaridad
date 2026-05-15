$content = Get-Content "c:\Users\Eduardo\Desktop\solidaridad\index.html" -Raw
$marker = "<!-- MENSAJES PANEL"
$index = $content.IndexOf($marker)
if ($index -gt 0) {
    $truncated = $content.Substring(0, $index)
    $truncated += "`r`n</body>`r`n</html>"
    [IO.File]::WriteAllText("c:\Users\Eduardo\Desktop\solidaridad\index.html", $truncated, [System.Text.Encoding]::UTF8)
    Write-Host "File truncated successfully at $marker"
} else {
    Write-Host "Marker $marker not found"
}

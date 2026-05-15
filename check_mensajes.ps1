
$bytes = [System.IO.File]::ReadAllBytes("test_index_utf8.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Check what chat-related features were in the original
$features = @(
    "mensajes-panel",
    "msg-conv-view",
    "msg-list-container",
    "screen-mensajes",
    "openMensajesPanel",
    "openChat",
    "chat-messages",
    "chat-input",
    "chat-block-btn",
    "mp-list",
    "mp-item",
    "mp-conv-view"
)
foreach ($f in $features) {
    $count = ([regex]::Matches($text, [regex]::Escape($f))).Count
    Write-Host "$f : $count occurrences"
}
Write-Host ""
Write-Host "Total file size: $($text.Length) chars"


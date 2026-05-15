$content = [System.IO.File]::ReadAllText("C:\Users\Eduardo\Desktop\solidaridad\index.html")
$start1 = $content.IndexOf("// SISTEMA DE MENSAJES 1 a 1 - SOLIDARIDAD")
if ($start1 -gt -1) {
    $scriptStart = $content.LastIndexOf("<script>", $start1)
    $end1 = $content.IndexOf("</script>", $start1) + 9
    $content = $content.Remove($scriptStart, $end1 - $scriptStart)
}

$start2 = $content.IndexOf("var chatSubscription = null;")
if ($start2 -gt -1) {
    $scriptStart = $content.LastIndexOf("<script>", $start2)
    $end2 = $content.IndexOf("</script>", $start2) + 9
    $content = $content.Remove($scriptStart, $end2 - $scriptStart)
}

$callStart = $content.IndexOf("setTimeout(function() { initRealChat(); }, 2500);")
if ($callStart -gt -1) {
    $content = $content.Remove($callStart, 49)
}

[System.IO.File]::WriteAllText("C:\Users\Eduardo\Desktop\solidaridad\index.html", $content, [System.Text.Encoding]::UTF8)
Write-Host "Done"

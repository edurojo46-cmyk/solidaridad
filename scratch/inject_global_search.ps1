$destSupaPath = "C:\Users\Eduardo\Desktop\solidaridad\supabase.js"
$supaAdd = [System.IO.File]::ReadAllText("C:\Users\Eduardo\Desktop\solidaridad\scratch\supa_global.js")
$destSupa = [System.IO.File]::ReadAllText($destSupaPath)
if (-not $destSupa.Contains('searchUsersGlobal')) {
    $destSupa = $destSupa + "`r`n`r`n" + $supaAdd
    [System.IO.File]::WriteAllText($destSupaPath, $destSupa, [System.Text.Encoding]::UTF8)
    Write-Host "Supabase global search appended!"
}

$destAppPath = "C:\Users\Eduardo\Desktop\solidaridad\app.js"
$appAdd = [System.IO.File]::ReadAllText("C:\Users\Eduardo\Desktop\solidaridad\scratch\app_global.js")
$destApp = [System.IO.File]::ReadAllText($destAppPath)
if (-not $destApp.Contains('chatGlobalSearchTimer')) {
    # We must overwrite the filterMsgList function!
    # Better yet, just append it and since it's global, it will overwrite the previous declaration.
    $destApp = $destApp + "`r`n`r`n" + $appAdd
    [System.IO.File]::WriteAllText($destAppPath, $destApp, [System.Text.Encoding]::UTF8)
    Write-Host "App JS global search appended!"
}

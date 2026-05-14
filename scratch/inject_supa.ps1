$srcSupaPath = "C:\Users\Eduardo\Desktop\solidaridad-nuevo\supabase.js"
$destSupaPath = "C:\Users\Eduardo\Desktop\solidaridad\supabase.js"
$srcSupa = [System.IO.File]::ReadAllText($srcSupaPath)
$destSupa = [System.IO.File]::ReadAllText($destSupaPath)
if (-not $destSupa.Contains('searchUsersGlobal')) {
    $chatIndex = $srcSupa.IndexOf('// Buscador Global de Usuarios')
    if ($chatIndex -gt -1) {
        [System.IO.File]::WriteAllText($destSupaPath, $srcSupa, [System.Text.Encoding]::UTF8)
        Write-Host "Supabase JS replaced with the one containing search logic!"
    }
}

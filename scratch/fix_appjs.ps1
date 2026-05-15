$lines = [System.IO.File]::ReadAllLines('C:\Users\Eduardo\Desktop\solidaridad\app.js')
$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -lt 2013 -or $i -gt 2028) {
        $newLines += $lines[$i]
    }
}
[System.IO.File]::WriteAllLines('C:\Users\Eduardo\Desktop\solidaridad\app.js', $newLines, [System.Text.Encoding]::UTF8)
Write-Host 'Done'

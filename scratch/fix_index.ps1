$content = [System.IO.File]::ReadAllText('C:\Users\Eduardo\Desktop\solidaridad\index.html', [System.Text.Encoding]::UTF8)
$startIdx = $content.IndexOf('// Hook into app navigation to load profile data')
$endIdx = $content.IndexOf('</body>', $startIdx)

$newContent = $content.Substring(0, $startIdx) + "// Hook into app navigation to load profile data`r`nvar originalNavigate = app.navigate;`r`napp.navigate = function(targetId) {`r`n    originalNavigate.call(app, targetId);`r`n    if (targetId === 'screen-profile') {`r`n        setTimeout(loadSolidaridadProfile, 100);`r`n    }`r`n};`r`n</script>`r`n" + $content.Substring($endIdx)

[System.IO.File]::WriteAllText('C:\Users\Eduardo\Desktop\solidaridad\index.html', $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Done"

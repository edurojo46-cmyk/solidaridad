$Content = Get-Content -Path "c:\Users\Eduardo\Desktop\solidaridad\target_zonas.txt" -Raw -Encoding Unicode

# Since it's a JS file format, it's hard to parse natively in powershell.
# But we can use regex to find {n:'...',d:'...',h:'...'}
$pattern = "\{n:'([^']*)',d:'([^']*)',h:'([^']*)'\}"
$matches = [regex]::Matches($Content, $pattern)

$output = "var zonasData = [`n"
$output += "  {id: 1, nombre: 'Buenos Aires (Comedores)', sub: 'Red principal', icon: 'ri-restaurant-fill', color: '#e67e22', grad: 'linear-gradient(135deg,#e67e22,#d35400)', iglesias: [`n"

$count = 0
foreach ($match in $matches) {
    if ($count -ge 20) { break } # limit to 20 for speed
    
    $n = $match.Groups[1].Value
    $d = $match.Groups[2].Value
    $h = $match.Groups[3].Value
    
    $cleanD = $d.Split(',')[0].Trim()
    $query = [uri]::EscapeDataString("$cleanD, Buenos Aires, Argentina")
    $url = "https://nominatim.openstreetmap.org/search?format=json&q=$query"
    
    Write-Host "Geocoding $cleanD..."
    
    $lat = -34.6037 + (Get-Random -Minimum -10 -Maximum 10)/1000
    $lng = -58.3816 + (Get-Random -Minimum -10 -Maximum 10)/1000
    
    try {
        $res = Invoke-RestMethod -Uri $url -Headers @{"User-Agent"="PowershellGeocode"}
        if ($res.Count -gt 0) {
            $lat = $res[0].lat
            $lng = $res[0].lon
            Write-Host "  -> FOUND: $lat, $lng" -ForegroundColor Green
        } else {
            Write-Host "  -> NOT FOUND" -ForegroundColor Red
        }
    } catch {
        Write-Host "  -> ERROR" -ForegroundColor Red
    }
    
    $output += "    {n: '$n', ciudad: 'CABA', d: '$d', h: '$h', tel: '', red: '', lat: $lat, lng: $lng},"
    $output += "`n"
    $count++
    
    Start-Sleep -Milliseconds 1500
}

$output += "  ]}`n"
$output += "];`n"

Set-Content -Path "c:\Users\Eduardo\Desktop\solidaridad\comedores_data.js" -Value $output -Encoding UTF8
Write-Host "Done!"

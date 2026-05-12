$Content = [System.IO.File]::ReadAllText("c:\Users\Eduardo\Desktop\solidaridad\target_zonas.txt", [System.Text.Encoding]::Unicode)

$pattern = "\{n:'([^']*)',d:'([^']*)',h:'([^']*)'\}"
$matches = [regex]::Matches($Content, $pattern)

$output = "var zonasData = [`n"
$output += "  {id: 1, nombre: 'Buenos Aires (Comedores)', sub: 'Red principal', icon: 'ri-restaurant-fill', color: '#e67e22', grad: 'linear-gradient(135deg,#e67e22,#d35400)', iglesias: [`n"

foreach ($match in $matches) {
    $n = $match.Groups[1].Value
    $d = $match.Groups[2].Value
    $h = $match.Groups[3].Value
    
    $cleanD = $d.Split(',')[0].Trim()
    $query = [uri]::EscapeDataString("$cleanD, Ciudad Autónoma de Buenos Aires, Argentina")
    $url = "https://nominatim.openstreetmap.org/search?format=json&q=$query"
    
    Write-Host "Geocoding $cleanD..."
    
    $lat = -34.6037
    $lng = -58.3816
    
    try {
        $res = Invoke-RestMethod -Uri $url -Headers @{"User-Agent"="SolidaridadApp"}
        if ($res.Count -gt 0) {
            $lat = $res[0].lat
            $lng = $res[0].lon
            Write-Host "  -> FOUND: $lat, $lng" -ForegroundColor Green
        } else {
            # Try a less strict query
            $query2 = [uri]::EscapeDataString("$cleanD, Buenos Aires, Argentina")
            $url2 = "https://nominatim.openstreetmap.org/search?format=json&q=$query2"
            $res2 = Invoke-RestMethod -Uri $url2 -Headers @{"User-Agent"="SolidaridadApp"}
            if ($res2.Count -gt 0) {
                $lat = $res2[0].lat
                $lng = $res2[0].lon
                Write-Host "  -> FOUND (fallback): $lat, $lng" -ForegroundColor Green
            } else {
                Write-Host "  -> NOT FOUND" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  -> ERROR" -ForegroundColor Red
    }
    
    # Replace single quotes with escape
    $safeN = $n -replace "'", "\'"
    $safeD = $d -replace "'", "\'"
    $safeH = $h -replace "'", "\'"
    
    $output += "    {n: '$safeN', ciudad: 'CABA', d: '$safeD', h: '$safeH', tel: '', red: '', lat: $lat, lng: $lng},`n"
    
    Start-Sleep -Milliseconds 1100
}

$output += "  ]}`n"
$output += "];`n"

[System.IO.File]::WriteAllText("c:\Users\Eduardo\Desktop\solidaridad\comedores_data.js", $output, [System.Text.Encoding]::UTF8)
Write-Host "Geocoding complete! File saved."

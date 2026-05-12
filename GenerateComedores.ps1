$provinces = @(
    @{name='Buenos Aires'; lat=-34.92; lng=-57.95},
    @{name='Catamarca'; lat=-28.46; lng=-65.78},
    @{name='Chaco'; lat=-27.46; lng=-58.98},
    @{name='Chubut'; lat=-43.30; lng=-65.10},
    @{name='CABA'; lat=-34.60; lng=-58.38},
    @{name='Córdoba'; lat=-31.42; lng=-64.18},
    @{name='Corrientes'; lat=-27.46; lng=-58.83},
    @{name='Entre Ríos'; lat=-31.73; lng=-60.52},
    @{name='Formosa'; lat=-26.18; lng=-58.17},
    @{name='Jujuy'; lat=-24.18; lng=-65.29},
    @{name='La Pampa'; lat=-36.61; lng=-64.28},
    @{name='La Rioja'; lat=-29.41; lng=-66.85},
    @{name='Mendoza'; lat=-32.89; lng=-68.84},
    @{name='Misiones'; lat=-27.36; lng=-55.89},
    @{name='Neuquén'; lat=-38.95; lng=-68.05},
    @{name='Río Negro'; lat=-40.81; lng=-62.99},
    @{name='Salta'; lat=-24.78; lng=-65.41},
    @{name='San Juan'; lat=-31.53; lng=-68.53},
    @{name='San Luis'; lat=-33.30; lng=-66.33},
    @{name='Santa Cruz'; lat=-51.62; lng=-69.21},
    @{name='Santa Fe'; lat=-31.63; lng=-60.70},
    @{name='Santiago del Estero'; lat=-27.78; lng=-64.26},
    @{name='Tierra del Fuego'; lat=-54.80; lng=-68.30},
    @{name='Tucumán'; lat=-26.82; lng=-65.22}
)

$names = @("Comedor Esperanza", "Olla Popular El Barrio", "Fundación Manos Abiertas", "Comedor Sonrisas", "La Olla del Pueblo", "Red Solidaria", "Comedor Pancita Llena", "Asociación Dar", "Comedor Los Niños", "Olla Comunitaria Centro")

$output = "var zonasData = [`n"
$rand = New-Object System.Random

for ($i = 0; $i -lt $provinces.Count; $i++) {
    $prov = $provinces[$i]
    $id = $i + 1
    
    $output += "  {id: $id, nombre: '$($prov.name)', sub: 'Red provincial', icon: 'ri-restaurant-fill', color: '#e67e22', grad: 'linear-gradient(135deg,#e67e22,#d35400)', iglesias: [`n"
    
    for ($j = 0; $j -lt 3; $j++) {
        $n = $names[$rand.Next($names.Count)] + " - " + $prov.name
        $d = "Calle Principal " + $rand.Next(100, 2000)
        
        $latOffset = ($rand.NextDouble() - 0.5) * 0.2
        $lngOffset = ($rand.NextDouble() - 0.5) * 0.2
        
        $lat = [math]::Round($prov.lat + $latOffset, 4).ToString([cultureinfo]::InvariantCulture)
        $lng = [math]::Round($prov.lng + $lngOffset, 4).ToString([cultureinfo]::InvariantCulture)
        
        $tel = "011" + $rand.Next(10000000, 99999999)
        $red = "ig: @comedor_" + $id + "_" + $j
        
        $output += "    {n: '$n', ciudad: 'Capital', d: '$d', h: 'L-V 12:00', tel: '$tel', red: '$red', lat: $lat, lng: $lng}"
        if ($j -lt 2) { $output += "," }
        $output += "`n"
    }
    
    $output += "  ]}"
    if ($i -lt $provinces.Count - 1) { $output += "," }
    $output += "`n"
}

$output += "];`n"

Set-Content -Path "c:\Users\Eduardo\Desktop\solidaridad\comedores_data.js" -Value $output -Encoding UTF8
Write-Host "Generated 72 comedores!"

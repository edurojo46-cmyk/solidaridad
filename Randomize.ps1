$Content = Get-Content -Path "c:\Users\Eduardo\Desktop\solidaridad\comedores_data.js" -Raw -Encoding UTF8

$rand = New-Object System.Random

# We will match the lat and lng values and replace them with slightly offset values
# The pattern is: lat: -3X.X, lng: -6X.X
$regex = [regex]"(lat:\s*(-?\d+(?:\.\d+)?),\s*lng:\s*(-?\d+(?:\.\d+)?))"

$evaluator = {
    param($match)
    
    $latBase = [double]$match.Groups[2].Value
    $lngBase = [double]$match.Groups[3].Value
    
    # Add random offset between -0.5 and +0.5 degrees (about 50km radius)
    $latOffset = ($rand.NextDouble() - 0.5)
    $lngOffset = ($rand.NextDouble() - 0.5)
    
    $newLat = $latBase + $latOffset
    $newLng = $lngBase + $lngOffset
    
    # Format to 4 decimal places
    $newLatStr = "{0:N4}" -f $newLat -replace ",", "."
    $newLngStr = "{0:N4}" -f $newLng -replace ",", "."
    
    return "lat: $newLatStr, lng: $newLngStr"
}

# PowerShell doesn't have a built-in Regex.Replace that takes a script block directly without some workarounds in PS 5.1
# Let's do it manually with a loop since there are only 72 matches.
$matches = $regex.Matches($Content)
$offset = 0
foreach ($m in $matches) {
    $latBase = [double]$m.Groups[2].Value
    $lngBase = [double]$m.Groups[3].Value
    
    $latOffset = ($rand.NextDouble() - 0.5)
    $lngOffset = ($rand.NextDouble() - 0.5)
    
    $newLat = [math]::Round($latBase + $latOffset, 4)
    $newLng = [math]::Round($lngBase + $lngOffset, 4)
    
    # Ensure dot separator
    $newLatStr = $newLat.ToString([cultureinfo]::InvariantCulture)
    $newLngStr = $newLng.ToString([cultureinfo]::InvariantCulture)
    
    $replacement = "lat: $newLatStr, lng: $newLngStr"
    
    $Content = $Content.Substring(0, $m.Index + $offset) + $replacement + $Content.Substring($m.Index + $m.Length + $offset)
    $offset += ($replacement.Length - $m.Length)
}

Set-Content -Path "c:\Users\Eduardo\Desktop\solidaridad\comedores_data.js" -Value $Content -Encoding UTF8
Write-Host "Randomization complete!"

$html = Get-Content -Raw index.html -Encoding UTF8

# Dictionary of replacements
$reps = @{
    "Ã¢â€ Å“ÃƒÂ¢Ã¢â€ Â¼ínete" = "Únete"
    "Ã¢â€ Â¬Ã¢â€ Â " = "¿"
    "Ã¢â€ Â¬í" = "¡"
    "Ã¢â€ Å“éÃ¢â€ Â¬Ãƒâ‚¬" = "•"
    "Ãƒâ€ Ãƒâ€¡ÃƒÂ¶" = "-"
    "ÃƒÂ " = "Ú"
    "Ãƒâ€ éÃ‚Â¼Ãƒâ€ Ãƒâ€¡Ã‚Â£" = "-"
    "Ã¢â€ Â¬Ã¢â€“â€˜" = "º"
    "Ã¢â€ Å“Ã¢â€¢Â ence" = "güence"
    "SITUACIÃƒâ€œN" = "SITUACIÓN"
    "Ã‚Â¿" = "¿"
    "GÃ¼emes" = "Güemes"
    "ÃƒÂ³" = "ó"
    "ÃƒÂ¡" = "á"
    "ÃƒÂ­" = "í"
    "ÃƒÂ©" = "é"
    "ÃƒÂº" = "ú"
    "ÃƒÂ±" = "ñ"
    "Ã³" = "ó"
    "Ã¡" = "á"
    "Ã­" = "í"
    "Ã©" = "é"
    "Ãº" = "ú"
    "Ã±" = "ñ"
}

foreach ($key in $reps.Keys) {
    $html = $html.Replace($key, $reps[$key])
}

[System.IO.File]::WriteAllText("$(Get-Location)\index.html", $html, [System.Text.Encoding]::UTF8)
Write-Host "Replaced successfully"

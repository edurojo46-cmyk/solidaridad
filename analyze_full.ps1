
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$testWords = @("Contrase", "Sesi", "Iniciar", "mnimo", "yuscula", "mero", "cter", "nexin")
foreach ($word in $testWords) {
    $idx = $text.IndexOf($word)
    if ($idx -ge 0) {
        $sample = $text.Substring($idx, [Math]::Min(15, $text.Length - $idx))
        $codes = ""
        for ($j = $idx; $j -lt [Math]::Min($idx+15, $text.Length); $j++) {
            $c = [int][char]$text[$j]
            if ($c -gt 127) { $codes += "{$c}" }
        }
        Write-Host "[$word]: codes=$codes"
        Write-Host "  sample=[$sample]"
    }
}


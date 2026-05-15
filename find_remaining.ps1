
$bytes = [System.IO.File]::ReadAllBytes("index.html")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$p = [char]195 + [char]402 + [char]194

# Find unique suffixes after the bad prefix
$suffixCounts = @{}
$idx = 0
while (($idx = $text.IndexOf($p, $idx)) -ge 0) {
    if ($idx + $p.Length -lt $text.Length) {
        $nextChar = [int][char]$text[$idx + $p.Length]
        $suffixCounts["$nextChar"] = ($suffixCounts["$nextChar"] -as [int]) + 1
    }
    $idx += $p.Length
}

Write-Host "Unique suffixes after bad prefix:"
foreach ($k in ($suffixCounts.Keys | Sort-Object {[int]$_})) {
    Write-Host "  char($k) x$($suffixCounts[$k])"
}


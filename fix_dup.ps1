
$lines = Get-Content index.html
# Remove lines 4901 to 4920 (0-indexed: 4900 to 4919)
$newLines = $lines[0..4899] + $lines[4920..($lines.Count-1)]
Set-Content index.html $newLines -Encoding UTF8
Write-Host "Done. Lines 4901-4920 removed. New total:" $newLines.Count


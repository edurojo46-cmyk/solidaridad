
$orig = Get-Content original_index_utf8.html -Raw
if ($orig -match "(?s)var searchIndex = \[(.*?)]\;") {
    $cleanBlock = $matches[0]
    $idx = Get-Content index.html -Raw
    $idx = $idx -replace "(?s)var searchIndex = \[.*?]\}?\s*\;", $cleanBlock
    Set-Content index.html $idx -Encoding UTF8
    Write-Host "Replaced searchIndex successfully."
} else {
    Write-Host "Could not find searchIndex in original_index_utf8.html"
}


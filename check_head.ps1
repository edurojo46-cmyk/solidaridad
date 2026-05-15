
$c = Get-Content index.html -Raw
$headEnd = $c.IndexOf("</head>")
Write-Host "Head ends at: $headEnd"
Write-Host $c.Substring($headEnd - 1000, 1050)


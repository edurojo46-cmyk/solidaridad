
$content = Get-Content index.html -Raw
$content = $content -replace "(?s)<script>window\.addEventListener\('error'.*?</script>", ""
$header = "<script>window.addEventListener('error', function(e) { fetch('http://localhost:8082/?error=' + encodeURIComponent(e.message + '|' + e.filename + '|' + e.lineno)); });</script>"
$content = $header + "`r`n" + $content
Set-Content index.html $content -Encoding UTF8


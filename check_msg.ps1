
$c = Get-Content index.html -Raw
Write-Host "msg-conv-view exists:" $c.Contains("msg-conv-view")



$c = Get-Content index.html -Raw
$badImg = [regex]::Matches($c, "ğŸ..")
$badVid = [regex]::Matches($c, "ÃƒÆ")
Write-Host "Corrupted image emojis remaining: " $badImg.Count
Write-Host "Corrupted video strings remaining: " $badVid.Count
Write-Host "initRealChat check:" ([regex]::Matches($c, "msg-list-container")).Count "references"


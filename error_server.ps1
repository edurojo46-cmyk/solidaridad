
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8082/")
$listener.Start()
Write-Host "Listening on 8082..."
$context = $listener.GetContext()
$request = $context.Request
Write-Host "Received: " $request.Url.Query
$response = $context.Response
$response.StatusCode = 200
$response.Close()
$listener.Stop()


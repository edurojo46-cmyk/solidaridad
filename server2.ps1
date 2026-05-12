# SOLIDARIDAD - Servidor TCP en puerto 8081
# No requiere permisos de administrador

$port = 8081
$rootPath = "c:\Users\Eduardo\Desktop\solidaridad"

$endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Loopback, $port)
$listener = New-Object System.Net.Sockets.TcpListener($endpoint)
$listener.Start()
Write-Host "SOLIDARIDAD corriendo en http://localhost:$port" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".mp4"  = "video/mp4"
    ".txt"  = "text/plain; charset=utf-8"
}

function Get-MimeType($ext) {
    if ($mimeTypes.ContainsKey($ext)) { return $mimeTypes[$ext] }
    return "application/octet-stream"
}

function Send-Response($client, $statusCode, $statusText, $contentType, $body) {
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $writer.AutoFlush = $false
    $writer.Write("HTTP/1.1 $statusCode $statusText`r`n")
    $writer.Write("Content-Type: $contentType`r`n")
    $writer.Write("Content-Length: $($body.Length)`r`n")
    $writer.Write("Connection: close`r`n")
    $writer.Write("Cache-Control: no-cache`r`n")
    $writer.Write("`r`n")
    $writer.Flush()
    $stream.Write($body, 0, $body.Length)
    $stream.Flush()
    $writer.Dispose()
}

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Read first line (e.g. "GET /index.html HTTP/1.1")
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) { $client.Close(); continue }
        
        # Drain headers
        while ($true) {
            $line = $reader.ReadLine()
            if ([string]::IsNullOrEmpty($line)) { break }
        }

        $parts = $requestLine -split " "
        $method = $parts[0]
        $rawPath = if ($parts.Count -ge 2) { $parts[1] } else { "/" }

        # Strip query string
        $pathOnly = ($rawPath -split "\?")[0]
        if ($pathOnly -eq "/" -or $pathOnly -eq "") { $pathOnly = "/index.html" }

        # Build file path
        $relPath = $pathOnly -replace "/", "\"
        $filePath = Join-Path $rootPath $relPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = Get-MimeType $ext
            Send-Response $client 200 "OK" $mime $bytes
            Write-Host "200 $pathOnly" -ForegroundColor Green
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $pathOnly")
            Send-Response $client 404 "Not Found" "text/plain" $notFound
            Write-Host "404 $pathOnly" -ForegroundColor Yellow
        }

        $client.Close()
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

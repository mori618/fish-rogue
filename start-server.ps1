# Simple HTTP Server for Fishing Game
# このスクリプトを実行してゲームをプレイしてください

$port = 8002
$path = $PSScriptRoot

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Fishing Game - Local Server" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server at: http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start simple HTTP server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server is running! Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:$port"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get the requested file path
        $localPath = $request.Url.LocalPath
        if ($localPath -eq '/') {
            $localPath = '/index.html'
        }
        
        $filePath = Join-Path $path $localPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            # Determine content type
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.js' { 'application/javascript; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.gif' { 'image/gif' }
                '.svg' { 'image/svg+xml' }
                default { 'application/octet-stream' }
            }
            
            $response.ContentType = $contentType
            $response.StatusCode = 200
            
            # Read and send file
            $buffer = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        else {
            # 404 Not Found
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $localPath")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.OutputStream.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Red
}

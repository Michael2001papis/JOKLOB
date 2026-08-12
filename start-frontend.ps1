$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\frontend"
if (-not (Test-Path "node_modules")) { npm install }
npm run dev

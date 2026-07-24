$ErrorActionPreference = "Stop"
$cache = Join-Path $PSScriptRoot ".cache"
$temp = Join-Path $cache "temp"
New-Item -ItemType Directory -Force -Path $temp | Out-Null

$env:USE_MEMORY_DB = "true"
$env:MONGOMS_DOWNLOAD_DIR = Join-Path $cache "mongodb"
$env:TEMP = $temp
$env:TMP = $temp

npx --yes pnpm@10.13.1 --filter @trimly/api dev

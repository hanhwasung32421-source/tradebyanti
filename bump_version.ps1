$ErrorActionPreference = "Stop"

$versionFile = Join-Path (Get-Location) "version.json"

function Get-TodayStamp {
  return (Get-Date).ToString("yyMMdd")
}

if (-not (Test-Path $versionFile)) {
  $obj = @{ date = (Get-TodayStamp); build = 1 }
} else {
  $raw = Get-Content $versionFile -Raw -Encoding UTF8
  $obj = $raw | ConvertFrom-Json

  $today = Get-TodayStamp
  if ($obj.date -ne $today) {
    $obj.date = $today
    $obj.build = 1
  } else {
    $obj.build = [int]$obj.build + 1
  }
}

$json = $obj | ConvertTo-Json -Depth 5
Set-Content -Path $versionFile -Value $json -Encoding UTF8

Write-Output ("{0}.{1}" -f $obj.date, $obj.build)


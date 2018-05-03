param(
    [string] $c
)
$stopwatch =  [system.diagnostics.stopwatch]::StartNew(); 

iex $c

Write-Host $stopwatch.elapsed
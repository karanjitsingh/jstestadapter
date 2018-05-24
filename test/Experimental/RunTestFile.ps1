param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log,
    [Parameter(Position=0,mandatory=$true)]
    [string[]] $path
)

if(!$runonly) {
    .\build.ps1
}

Write-Host "`nStarting Execution...`n"

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --TestAdapterPath:D:\JSTestAdapter\src\JSTest.TestAdapter\bin\Debug\net451 --Settings:.\RunSettings.xml `
$path `
$(if($log) {"--diag:D:\logs\log.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"})


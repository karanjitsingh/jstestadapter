param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log,
    [Parameter(Position=0,mandatory=$true)]
    [string[]] $path
)

. ..\..\scripts\base.ps1

if(!$runonly) {
    ..\..\scripts\build.ps1
}

Write-Host "`nStarting Execution...`n"

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --TestAdapterPath:$FullCLRAdapter --Settings:.\RunSettings.xml `
$path `
$(if($log) {"--diag:D:\logs\log.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"})


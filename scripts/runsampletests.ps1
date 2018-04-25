param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log
)

if(!$runonly) {
    .\build.ps1
}

Write-Host "`nStarting Execution...`n"

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript.jasmine `
"E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_A.js" `
$(if($log) {"--diag:D:\logs\jstest.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"}) `
--tests:"A3"
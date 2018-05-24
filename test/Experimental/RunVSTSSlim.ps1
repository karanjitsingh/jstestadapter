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

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --TestAdapterPath:D:\JSTestAdapter\src\JSTest.TestAdapter\bin\Debug\net451 --Settings:.\RunSettings.xml `
"D:/vsts-tasks/_build/Tasks/AndroidSigning/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AppCenterDistribute/Tests/L0.js" `
$(if($log) {"--diag:D:\logs\log.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"})


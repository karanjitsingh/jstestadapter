param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log
)

. ..\..\scripts\base.ps1

if(!$runonly) {
    ..\..\scripts\build.ps1
}

Write-Host "`nStarting Execution...`n"

D:\vstest\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --Inisolation --TestAdapterPath:C:\Users\karsin\AppData\Local\Temp\4c169762-bd5b-4bc3-b965-b5c69c272df1\node_modules\jstestadapter `
"C:\Users\karsin\AppData\Local\Temp\4c169762-bd5b-4bc3-b965-b5c69c272df1\package-lock.json" `
$(if($log) {"--diag:D:\logs\log.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"}) `
-- JSTest.TestFramework=Jest
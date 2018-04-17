param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel
)

if(!$runonly) {
    .\build.ps1
}

Write-Host "`nStarting Execution...`n"

# D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript `
# # "D:\vsts-tasks\_build\Tasks\AndroidSigning\androidsigning.js" `
# # "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_A.js" `
# "D:\stuff\test\spec2\simple_test.js" `
# # "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_B.js" `
# # "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-puppeteer\puppeteer-test.js" `
# /diag:D:\logs\jstest.log `
# $(if($discover) {"--listtests"}) `
# $(if($parallel) {"--parallel"})

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript "D:\stuff\test\spec2\simple_test.js"
# D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_A.js"
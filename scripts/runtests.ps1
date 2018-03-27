.\build.ps1

Write-Host "`n Starting Execution...`n"

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_A.js" "E:\Public\ChutzpahNodeScenarios\ChutzpahNodeScenarios\spec-basic\simple_test_B.js" /diag:"D:\logs\log2.log"
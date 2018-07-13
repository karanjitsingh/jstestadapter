param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log,
    [string]$test = "",
    [string]$vstest = "D:\vstest\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe"
)


. .\base.ps1

$tests = Get-ChildItem -Path $TestFolder -Recurse -Filter "*.js"

if((Test-Path $vstest) -ne 'True') {
    Write-Host "vstest path '$vstest' is not valid";
    exit;
}

$vstest = "& '$vstest'"

$command = "$vstest --TestAdapterPath:$FullCLRAdapter --inisolation"
if($log) {
    $command = "$command --diag:D:\logs\jstest.log"
}
if($discover) {
    $command = "$command --listtests"
}
if($parallel) {
    $command = "$command --parallel"
}
if($test -ne "") {
    $command = "$command --tests:$test"
}


if(!$runonly) {
    npm run build:test
}

Write-Host "Test files:"

if($filter -eq "") {
    $filter = "*"
}
else {
    $filter = "*$filter*"
}

foreach($path in $tests) {
    if("$($path.FullName)" -like $filter) {
        Write-Host "$path"
        $command = $($command + " `"$($path.FullName)`"")
    }
}

$command = "$command -- JSTest.TestFramework=mocha JSTest.DebugLogs=true"


Write-Host "------------------------------------------------------------------------------------------------------------"
Write-Host $command
Write-Host "------------------------------------------------------------------------------------------------------------"


iex $command
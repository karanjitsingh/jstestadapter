param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log,
    [string]$test = "",
    [string]$vstest = "D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe"
)


$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$testFolder = Join-Path $ProjectDir "test\JSTest.Runner.UnitTests\bin\test"

$tests = Get-ChildItem -Path $testFolder -Recurse -Filter "*.js"

if((Test-Path $vstest) -ne 'True') {
    Write-Host "vstest path '$vstest' is not valid";
    exit;
}

$command = "& '$vstest' --TestAdapterPath:$(Join-Path $ProjectDir "artifacts\Debug\net451")"
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

$command = "$command -- JSTest.TestFramework=mocha"


Write-Host "------------------------------------------------------------------------------------------------------------"
Write-Host $command
Write-Host "------------------------------------------------------------------------------------------------------------"


iex $command
param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log
)

if(!$runonly) {
    .\build.ps1
}

$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$testFolder = Join-Path $ProjectDir "test\JSTest.Runner.UnitTests\bin\test"

$tests = Get-ChildItem -Path $testFolder -Recurse -Filter "*.js"

$command = "D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --TestAdapterPath:D:\JSTestAdapter\src\JSTest.TestAdapter\bin\Debug\net451 --Settings:.\RunSettings.xml"
if($log) {
    $command = "$command --diag:D:\logs\jstest.log"
}
if($discover) {
    $command = "$command --listtests"
}
if($parallel) {
    $command = "$command --parallel"
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

Write-Host "------------------------------------------------------------------------------------------------------------"
Write-Host $command
Write-Host "------------------------------------------------------------------------------------------------------------"


iex $command
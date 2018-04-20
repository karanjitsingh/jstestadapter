
Write-Host "Building tests.`n"
npm run test

Write-Host "Killing node process.`n"
Stop-Process -Force -Name "node" -ErrorAction SilentlyContinue

$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$testFolder = Join-Path $ProjectDir "test\JSTestHost.UnitTests\bin\test"
$tests = Get-ChildItem -Path $testFolder -Recurse -Filter "*.js"

$command = "D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript"

foreach($path in $tests) {
    $command = $($command + " `"$($path.FullName)`"")
}

iex $command
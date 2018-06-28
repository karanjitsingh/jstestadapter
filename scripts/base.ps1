$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$PackageJSON = Join-Path $ProjectDir "package.json"
$JSTestRunnerBin = Join-Path $ProjectDir "src\JSTest.Runner\bin\$configuration\"
$JSTestAdapterBin = Join-Path $ProjectDir "src\JSTest.TestAdapter\bin\$configuration\"
$Artifacts = Join-Path $ProjectDir "artifacts"
$ProjectSolutionFile = (Join-Path $ProjectDir ".\JSTest.sln")
$TestFolder = Join-Path $ProjectDir "test\JSTest.Runner.UnitTests\bin\test"
$FullCLRAdapter = Join-Path $ProjectDir "artifacts\Debug\net451"
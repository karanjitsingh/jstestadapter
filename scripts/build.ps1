param(
    [switch] $clean,
    [switch] $nolint
)

$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$PackageJSON = Join-Path $ProjectDir "package.json"
$NodeBinaries = Join-Path $ProjectDir "packages\node.js.redist\8.9.1\tools\*"
$JSTestRunnerBin = Join-Path $ProjectDir "src\JSTest.Runner\bin\"
$JSTestDir = Join-Path $ProjectDir "src\JSTest.Runner\bin\JSTest.Runner"

if($clean) {
    Write-Host "Cleaning folders.`n";

    Remove-Item $JSTestRunnerBin -Recurse -Force -ErrorAction SilentlyContinue
    dotnet msbuild (Join-Path $ProjectDir ".\JSTest.sln") /t:clean

    exit
}

Write-Host "Starting msbuild.`n"
dotnet msbuild (Join-Path $ProjectDir ".\JSTest.sln")

Write-Host "`nStarting typescript build."
if(!$nolint) { npm run lint }
npm run compile

function CreateDirectory($dir)
{
    if (!(Test-Path $dir))
    {
        mkdir $dir > $null
    }
}

Write-Host "Killing node process.`n"
Stop-Process -Force -Name "node" -ErrorAction SilentlyContinue

Write-Host "Copying node binaries to JSTest.Runner bin."
Copy-Item -Path $NodeBinaries -Destination (Join-Path $JSTestRunnerBin "node\") -Recurse -force

Write-Host "`nRunning npm install"

Copy-Item -Path $PackageJSON -Destination $JSTestDir -force
$dir = Get-Location
Set-Location $JSTestDir
npm install --production
Set-Location $dir

Remove-Item (Join-Path $JSTestDir "package.json") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $JSTestDir "package-lock.json") -Force -ErrorAction SilentlyContinue
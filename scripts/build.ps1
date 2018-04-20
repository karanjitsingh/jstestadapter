param(
    [switch] $clean,
    [switch] $nolint,
    [ValidateSet('netcoreapp2.0','net451')]
    [string] $target="net451"
)

$CLRDir = ""
$CLRExtensionsDir = ""
$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$packageJSON = Join-Path $ProjectDir "package.json"
$FullCLRDir = Join-Path $ProjectDir "src\TestHostProvider\bin\Debug\net451\"
$CoreCLRDir = Join-Path $ProjectDir "src\TestHostProvider\bin\Debug\netcoreapp2.0\"
$FullCLRExtensionsDir = "D:\vstest\artifacts\Debug\net451\win7-x64\Extensions\"
$CoreCLRExtensionsDir = "D:\vstest\artifacts\Debug\netcoreapp2.0\Extensions\"
$NodeBinaries = Join-Path $ProjectDir "packages\node.js.redist\8.9.1\tools\*"
$TestHostDir = Join-Path $ProjectDir "src\JSTestHost\bin\JSTestHost\"

if($target -eq "net451") {
    $CLRDir = $FullCLRDir
    $CLRExtensionsDir = $FullCLRExtensionsDir
} elseif ($target -eq "netcoreapp2.0") {
    $CLRDir = $CoreCLRDir
    $CLRExtensionsDir = $CoreCLRExtensionsDir
}

if($clean) {
    Write-Host "Cleaning folders.`n";

    Remove-Item (Join-Path $FullCLRExtensionsDir "node") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $CoreCLRExtensionsDir "node") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $FullCLRExtensionsDir "JSTestHost") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $CoreCLRExtensionsDir "JSTestHost") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $ProjectDir "bin\Debug\*") -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting msbuild.`n"
dotnet msbuild (Join-Path $ProjectDir "src\TestHostProvider")

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

CreateDirectory (Join-Path $CLRDir "node\")

Write-Host "Killing node process.`n"
Stop-Process -Force -Name "node" -ErrorAction SilentlyContinue

Write-Host "Copying node binaries to local output directory."
Copy-Item -Path $NodeBinaries -Destination (Join-Path $CLRDir "node\") -Recurse -force

Write-Host "Copying local output to vstest extensions folder."
Copy-Item -Path (Join-Path $CLRDir "*") -Destination $CLRExtensionsDir -Recurse -Force

Write-Host "Copying package.json to JSTestHost folder"
Copy-Item -Path $packageJSON -Destination $TestHostDir -Recurse -Force

Write-Host "Copying JSTestHost to vstest extensions folder."
Copy-Item -Path $TestHostDir -Destination $CLRExtensionsDir -Recurse -Force

Write-Host "`nRunning npm install"
$dir = Get-Location
Set-Location (Join-Path $CLRExtensionsDir "JSTestHost")
npm install --production
Set-Location $dir
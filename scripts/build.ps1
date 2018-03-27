

$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$tsCompiler = Join-Path $ProjectDir "node_modules\.bin\tsc"
$tsConfig = Join-Path $ProjectDir "tsconfig.json"
$FullCLRDir = Join-Path $ProjectDir "bin\Debug\net451\"
$CoreCLRDir = Join-Path $ProjectDir "bin\Debug\netcoreapp2.0\"
$FullCLRExtensionsDir = "D:\vstest\artifacts\Debug\net451\win7-x64\Extensions\"
$CoreCLRExtensionsDir = "D:\vstest\artifacts\Debug\netcoreapp2.0\Extensions\"
$NodeBinaries = Join-Path $ProjectDir "packages\node.js.redist\8.9.1\tools\*"
$TestHostDir = Join-Path $ProjectDir "bin\Debug\jstesthost\"

Write-Host "Starting msbuild.`n"
dotnet msbuild $ProjectDir

Write-Host "`nStarting typescript build."
npm run build

function CreateDirectory($dir)
{
    if (!(Test-Path $dir))
    {
        mkdir $dir > $null
    }
}

CreateDirectory (Join-Path $FullCLRDir "node\")
CreateDirectory (Join-Path $CoreCLRDir "node\")

Write-Host "Copying node binaries to local output directory."
Copy-Item -Path $NodeBinaries -Destination (Join-Path $FullCLRDir "node\") -Recurse -force
Copy-Item -Path $NodeBinaries -Destination (Join-Path $CoreCLRDir "node\") -Recurse -force

Write-Host "Copying local output to vstest extensions folder."
Copy-Item -Path (Join-Path $FullCLRDir "*") -Destination $FullCLRExtensionsDir -Recurse -Force
Copy-Item -Path (Join-Path $CoreCLRDir "*") -Destination $CoreCLRExtensionsDir -Recurse -Force

Write-Host "Copying JSTestHost to vstest extensions folder."
Copy-Item -Path $TestHostDir -Destination $FullCLRExtensionsDir -Recurse -Force
Copy-Item -Path $TestHostDir -Destination $CoreCLRExtensionsDir -Recurse -Force
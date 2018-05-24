param(
    [switch] $clean,
    [switch] $nolint,
    [ValidateSet("Debug", "Release")]
    [string] $configuration="Debug",
    [ValidateSet("net451", "netstandard1.4")]
    [string] $target="net451"
)

$ProjectDir = (Get-Item ([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))).Parent.FullName
$PackageJSON = Join-Path $ProjectDir "package.json"
$JSTestRunnerBin = Join-Path $ProjectDir "src\JSTest.Runner\bin\"
$JSTestAdapterBin = Join-Path $ProjectDir "src\JSTest.TestAdapter\bin\$configuration\"
$Artifacts = Join-Path $ProjectDir "artifacts"
$ProjectSolutionFile = (Join-Path $ProjectDir ".\JSTest.sln")

function CreateDirectory($dir)
{
    if (!(Test-Path $dir))
    {
        mkdir $dir > $null
    }
}

function Build-Clean {
    Write-Host "Cleaning folders.`n";

    Remove-Item $JSTestRunnerBin -Recurse -Force -ErrorAction SilentlyContinue
    dotnet msbuild $ProjectSolutionFile /t:clean 
}

function Restore-Package {
    Write-Host "`nRestoring nuget packages.`n"
    dotnet restore $ProjectSolutionFile
    
    Write-Host "`nRestoring npm packages.`n"
    npm install
}

function Publish-Package {
    
    Write-Host "`nPublishing to artifacts."

    $RunnerPath = [IO.Path]::Combine($Artifacts, $configuration, $target, "JSTest.Runner")

    CreateDirectory($Artifacts)
    CreateDirectory($RunnerPath)

    # Copy dlls
    Copy-Item -Path $JSTestAdapterBin -Destination $Artifacts -Force -Recurse

    # Copy JSTestRunner
    Copy-Item -Path (Join-Path $JSTestRunnerBin "*") -Destination $RunnerPath -Force -Recurse
}

function Build-Project {
    Write-Host "`nStarting msbuild.`n"
    dotnet msbuild $ProjectSolutionFile /p:Configuration=$configuration
    
    Write-Host "`nStarting typescript build."
    if(!$nolint) { npm run lint }
    npm run compile

}

if($clean) { Build-Clean; exit }
Restore-Package
Build-Project
Publish-Package

# Write-Host "`nRunning npm install"

# Copy-Item -Path $PackageJSON -Destination $JSTestRunnerBin -force
# $dir = Get-Location
# Set-Location $JSTestRunnerBin
# npm install --production
# Set-Location $dir

# Remove-Item (Join-Path $JSTestRunnerBin "package.json") -Force -ErrorAction SilentlyContinue
# Remove-Item (Join-Path $JSTestRunnerBin "package-lock.json") -Force -ErrorAction SilentlyContinue
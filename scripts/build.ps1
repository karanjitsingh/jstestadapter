param(
    [switch] $clean,
    [switch] $nolint,
    [ValidateSet("Debug", "Release")]
    [string] $configuration="Debug",
    [ValidateSet("net451", "netstandard1.4")]
    [string] $target="net451"
)

$base = "$([System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition))\base.ps1"

. $base

function CreateDirectory($dir)
{
    if (!(Test-Path $dir))
    {
        mkdir $dir > $null
    }
}

function Build-Clean {
    Write-Host "Cleaning folders.`n";
    
    Remove-Item (Join-Path $ProjectDir "artifacts\*") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $ProjectDir "src\JSTest.Runner\bin\") -Recurse -Force -ErrorAction SilentlyContinue
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

    $RunnerPath = [IO.Path]::Combine($Artifacts, $configuration, $target)
    $ConfigurationPath = Join-Path $Artifacts $configuration

    CreateDirectory($Artifacts)

    # Copy dlls
    Copy-Item -Path $JSTestAdapterBin -Destination $Artifacts -Force -Recurse

    # Copy JSTestRunner
    Copy-Item -Path (Join-Path $JSTestRunnerBin "*") -Destination $RunnerPath -Force -Recurse

    # Copy Package.json & README.md
    Copy-Item -Path (Join-Path $ProjectDir "package.json") -Destination $RunnerPath -Force
    Copy-Item -Path (Join-Path $ProjectDir "README.md") -Destination $RunnerPath -Force


    # Since PrivateAssets attribute is not working in the PackageReference tag in csproj, we have to delete devDependancies manually
    $files = "cs", "de", "es", "fr", "it", "ja", "ko", "pl", "pt-BR", "ru", "tr", "zh-Hans", "zh-Hant", "Microsoft*", "System*"
    Foreach($file in $files) {
        Remove-Item (Join-Path $RunnerPath $file) -Recurse -Force -ErrorAction SilentlyContinue
    }

    Push-Location $ConfigurationPath
    npm pack $RunnerPath
    Pop-Location 
}

function Build-Solution {
    Write-Host "`nStarting msbuild.`n"
    if($configuration -eq "Release") {
        dotnet build $ProjectSolutionFile /p:"Configuration=$configuration;TargetFramework=$target" /p:DebugSymbols=false /p:DebugType=None
    }
    else {
        dotnet build $ProjectSolutionFile /p:"Configuration=$configuration;TargetFramework=$target"
    }

    # Delete Unnecessary files produced in net451

    Write-Host "`nStarting typescript build."
    if(!$nolint) { npm run lint }
    npm run build:$configuration

    if($configuration -eq "Release") {
        # Remove-Item -Recurse "$JSTestRunnerBin*.map"
        Get-ChildItem -Path $JSTestRunnerBin -Recurse -Filter *.map | Remove-Item
    }
}

if($clean) { Build-Clean; }
Restore-Package
Build-Solution
Publish-Package

# Write-Host "`nRunning npm install"

# Copy-Item -Path $PackageJSON -Destination $JSTestRunnerBin -force
# $dir = Get-Location
# Set-Location $JSTestRunnerBin
# npm install --production
# Set-Location $dir

# Remove-Item (Join-Path $JSTestRunnerBin "package.json") -Force -ErrorAction SilentlyContinue
# Remove-Item (Join-Path $JSTestRunnerBin "package-lock.json") -Force -ErrorAction SilentlyContinue
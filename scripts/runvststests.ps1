param(
    [switch]$runonly,
    [switch]$discover,
    [switch]$parallel,
    [switch]$log
)

if(!$runonly) {
    .\build.ps1
}

Write-Host "`nStarting Execution...`n"

D:\vstest\artifacts\Debug\net451\win7-x64\vstest.console.exe --framework:javascript `
"D:/vsts-tasks/_build/Tasks/AndroidSigning/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AppCenterDistribute/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AppCenterTest/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureAppServiceManage/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureFileCopy/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureMonitorAlerts/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureMysqlDeployment/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureNLBManagement/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzurePowerShell/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureResourceGroupDeployment/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureRmWebAppDeployment/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/AzureVmssDeployment/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/CopyFiles/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Docker/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/DockerCompose/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/DotNetCoreCLI/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/DotNetCoreInstaller/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/DownloadSecureFile/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Go/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Gradle/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/IISWebAppDeploymentOnMachineGroup/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/IISWebAppManagementOnMachineGroup/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/InstallAppleCertificate/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/InstallAppleProvisioningProfile/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/InstallSSHKey/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/JavaToolInstaller/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/JenkinsDownloadArtifacts/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/JenkinsQueueJob/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Kubernetes/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/MSBuild/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Npm/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/NuGet/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/NuGetCommand/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/NuGetPublisher/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/PackerBuild/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/PowerShellOnTargetMachines/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/PublishSymbols/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/PublishTestResults/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/PyPIPublisher/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/ServiceFabricComposeDeploy/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/ServiceFabricDeploy/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/ServiceFabricPowerShell/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/ServiceFabricUpdateManifests/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/SqlAzureDacpacDeployment/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/UsePythonVersion/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/UseRubyVersion/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/VisualStudioTestPlatformInstaller/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/VSBuild/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/VSTest/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/WindowsMachineFileCopy/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/XamarinAndroid/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/XamariniOS/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Xcode/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Common/MSBuildHelpers/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Common/nuget-task-common/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Common/PowershellHelpers/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Common/VstsAzureHelpers_/Tests/L0.js" `
"D:/vsts-tasks/_build/Tasks/Common/VstsAzureRestHelpers_/Tests/L0.js" `
"D:\vsts-tasks\_build\Tests\L0.js" `
$(if($log) {"--diag:D:\logs\jstest.log"}) `
$(if($discover) {"--listtests"}) `
$(if($parallel) {"--parallel"})


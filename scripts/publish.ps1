param(
    [switch] $beta
)

. .\base.ps1

./build.ps1 -configuration Release -clean

$file = Get-ChildItem ..\artifacts\Release\jstestadapter*.tgz | select -last 1

$filename = $file.Name

$command = ""
$confirmation = "n"

Write-host ""

if ($beta) {
    if($filename -match "^jstestadapter-[0-9]+\.[0-9]+\.[0-9]+-beta\.[0-9]+\.tgz$") {
        $confirmation = Read-Host "Publish beta package" $filename"? [Y/N]"
        $command = "npm publish $($file.fullname) --tags beta"
    }
    else {
        Write-host "Package $filename does not match beta version format"
    }
}
else {
    if($filename -match "^jstestadapter-[0-9]+\.[0-9]+\.[0-9]+\.tgz$") {
        $confirmation = Read-Host "Publish release package" $filename"? [Y/N]"
        $command = "npm publish $($file.fullname)"
    }
    else {
        Write-host "Package $filename does not match release version format"
    }
}

if ($confirmation -eq 'y') {
    npm login
    Write-Host $command
    iex $command
}
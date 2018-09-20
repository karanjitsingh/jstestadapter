
. .\base.ps1

./build.ps1 -configuration Release -clean

$file = Get-ChildItem ..\artifacts\Release\jstestadapter*.tgz | select -last 1

$filename = $file.Name

write-host $filename

$confirmation = Read-Host "Publish" $filename"? [Y/N]"
if ($confirmation -eq 'y') {
    npm login    
    npm publish $file.fullname
}
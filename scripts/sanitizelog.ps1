param(
    [string] $logfile
)

$nonProtocolRegex = "^(?!.*PROTOCOL).*$"
$protocolRegex = "^.*(send|receive):(.*)"

function Format-Json([Parameter(Mandatory, ValueFromPipeline)][String] $json) {
    $indent = 0;
    ($json -Split '\r\n' |
        % {
            if ($_ -match '^\s*[\}\]]') {
                $indent--
            }
            $line = (' ' * $indent * 4) + $_.TrimStart().Replace(':  ', ': ')
            if ($_ -match '(^\s*[\[\{]$)|(^\s*".*":\s*[\{\[])') {
                $indent++
            }
            $line
        }) -Join "`r`n"
  }

if(Test-Path $logfile) {
    $json = "{"

    foreach($line in Get-Content $logfile) {
        if(!($line -cmatch $nonProtocolRegex)) {
            if($line -match $protocolRegex) {

                $prettyvalue = $Matches[2] | ConvertFrom-Json | ConvertTo-Json
                $prettyvalue = $prettyvalue -replace '\r\n', "`r`n    " -join "`r`n"
                $jsonvalue = "`"$($Matches[1])`": $prettyvalue"

                if($json -eq "{") {
                    $json = "$json`r`n    $jsonvalue"
                }
                else {
                    $json = "$json,`r`n    $jsonvalue"
                }
            }
        }
    }

    $json = "$json`r`n}"
    $json = Format-Json $json
    $json = $json -replace "\{[\s\n]*\}", "{}"
    $json | Out-File -LiteralPath $logfile -Force

    Write-Host $json
}
else {
    Write-Error "Not such file.";
}

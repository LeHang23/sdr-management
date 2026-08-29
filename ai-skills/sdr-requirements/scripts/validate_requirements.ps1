param(
    [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Join-Path $PSScriptRoot '..\..\..'
}

$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
$englishRoot = Join-Path $projectPath 'docs\requirements'
$vietnameseRoot = Join-Path $projectPath 'docs\requirements_vi'
$errors = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError {
    param([string]$Message)
    $errors.Add($Message)
}

foreach ($root in @($englishRoot, $vietnameseRoot)) {
    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        Add-ValidationError "Missing requirements directory: $root"
        continue
    }

    if (-not (Test-Path -LiteralPath (Join-Path $root 'FBS.md') -PathType Leaf)) {
        Add-ValidationError "Missing FBS.md: $root"
    }

    foreach ($legacyName in @('RS', 'SRS', 'RS.md', 'SRS.md')) {
        $legacyPath = Join-Path $root $legacyName
        if (Test-Path -LiteralPath $legacyPath) {
            Add-ValidationError "Legacy aggregate structure is not allowed: $legacyPath"
        }
    }
}

if (-not (Test-Path -LiteralPath $englishRoot -PathType Container) -or
    -not (Test-Path -LiteralPath $vietnameseRoot -PathType Container)) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

$englishScreens = Get-ChildItem -LiteralPath $englishRoot -Directory |
    Select-Object -ExpandProperty Name |
    Sort-Object
$vietnameseScreens = Get-ChildItem -LiteralPath $vietnameseRoot -Directory |
    Select-Object -ExpandProperty Name |
    Sort-Object

$fbsIdPattern = '\bFBS-[0-9]+(?:\.[0-9]+)*\b'
$englishFbsText = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $englishRoot 'FBS.md')
$vietnameseFbsText = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $vietnameseRoot 'FBS.md')
$englishFbsIds = @([regex]::Matches($englishFbsText, $fbsIdPattern) |
    ForEach-Object { $_.Value } |
    Sort-Object -Unique)
$vietnameseFbsIds = @([regex]::Matches($vietnameseFbsText, $fbsIdPattern) |
    ForEach-Object { $_.Value } |
    Sort-Object -Unique)
foreach ($difference in (Compare-Object $englishFbsIds $vietnameseFbsIds)) {
    Add-ValidationError "FBS ID mismatch between languages: $($difference.InputObject)"
}

$screenDiff = Compare-Object $englishScreens $vietnameseScreens
foreach ($difference in $screenDiff) {
    Add-ValidationError "Screen folder mismatch: $($difference.InputObject) exists only on side $($difference.SideIndicator)"
}

$screenNamePattern = '^[A-Z0-9]+(?:-[A-Z0-9]+)*$'
$rsFilePattern = '^RS-[0-9]{2,}-[A-Z0-9]+(?:-[A-Z0-9]+)*\.md$'
$requirementIdPattern = '\b(?:SRS|RS)-[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-[0-9]{2}\b'

foreach ($screen in $englishScreens) {
    if ($screen -notmatch $screenNamePattern) {
        Add-ValidationError "Screen folder must use uppercase kebab case: $screen"
    }

    $englishScreen = Join-Path $englishRoot $screen
    $vietnameseScreen = Join-Path $vietnameseRoot $screen
    if (-not (Test-Path -LiteralPath $vietnameseScreen -PathType Container)) {
        continue
    }

    foreach ($screenPath in @($englishScreen, $vietnameseScreen)) {
        if (-not (Test-Path -LiteralPath (Join-Path $screenPath 'SRS.md') -PathType Leaf)) {
            Add-ValidationError "Missing SRS.md in screen folder: $screenPath"
        }

        $rsFiles = Get-ChildItem -LiteralPath $screenPath -File |
            Where-Object { $_.Name -ne 'SRS.md' }
        if ($rsFiles.Count -eq 0) {
            Add-ValidationError "No RS feature files found in: $screenPath"
        }
        foreach ($file in $rsFiles) {
            if ($file.Name -notmatch $rsFilePattern) {
                Add-ValidationError "Invalid RS filename: $($file.FullName)"
            }
        }
    }

    $englishFiles = Get-ChildItem -LiteralPath $englishScreen -File |
        Select-Object -ExpandProperty Name |
        Sort-Object
    $vietnameseFiles = Get-ChildItem -LiteralPath $vietnameseScreen -File |
        Select-Object -ExpandProperty Name |
        Sort-Object
    foreach ($difference in (Compare-Object $englishFiles $vietnameseFiles)) {
        Add-ValidationError "File mismatch in ${screen}: $($difference.InputObject) exists only on side $($difference.SideIndicator)"
    }

    foreach ($filename in $englishFiles) {
        $englishFile = Join-Path $englishScreen $filename
        $vietnameseFile = Join-Path $vietnameseScreen $filename
        if (-not (Test-Path -LiteralPath $vietnameseFile -PathType Leaf)) {
            continue
        }

        $englishText = Get-Content -Raw -Encoding utf8 -LiteralPath $englishFile
        $vietnameseText = Get-Content -Raw -Encoding utf8 -LiteralPath $vietnameseFile
        $englishIds = @([regex]::Matches($englishText, $requirementIdPattern) |
            ForEach-Object { $_.Value } |
            Sort-Object -Unique)
        $vietnameseIds = @([regex]::Matches($vietnameseText, $requirementIdPattern) |
            ForEach-Object { $_.Value } |
            Sort-Object -Unique)
        foreach ($difference in (Compare-Object $englishIds $vietnameseIds)) {
            Add-ValidationError "Requirement ID mismatch in ${screen}/${filename}: $($difference.InputObject)"
        }
    }

    $srsPath = Join-Path $englishScreen 'SRS.md'
    if (Test-Path -LiteralPath $srsPath -PathType Leaf) {
        $srsText = Get-Content -Raw -Encoding utf8 -LiteralPath $srsPath
        $references = [regex]::Matches($srsText, 'RS-[0-9]{2,}-[A-Z0-9]+(?:-[A-Z0-9]+)*\.md') |
            ForEach-Object { $_.Value } |
            Sort-Object -Unique
        foreach ($reference in $references) {
            if (-not (Test-Path -LiteralPath (Join-Path $englishScreen $reference) -PathType Leaf)) {
                Add-ValidationError "Broken RS reference in $screen/SRS.md: $reference"
            }
        }

        $srsScreenCodes = @([regex]::Matches($srsText, '\bSRS-([A-Z0-9]+)-[0-9]{2}\b') |
            ForEach-Object { $_.Groups[1].Value } |
            Sort-Object -Unique)
        if ($srsScreenCodes.Count -ne 1) {
            Add-ValidationError "Expected exactly one SRS screen code in $screen/SRS.md; found $($srsScreenCodes.Count)"
        } else {
            $expectedScreenCode = $srsScreenCodes[0]
            foreach ($filename in $englishFiles) {
                $filePath = Join-Path $englishScreen $filename
                $fileText = Get-Content -Raw -Encoding utf8 -LiteralPath $filePath

                $fileFbsIds = @([regex]::Matches($fileText, $fbsIdPattern) |
                    ForEach-Object { $_.Value } |
                    Sort-Object -Unique)
                foreach ($fbsId in $fileFbsIds) {
                    if ($fbsId -notin $englishFbsIds) {
                        Add-ValidationError "Unknown FBS reference in ${screen}/${filename}: $fbsId"
                    }
                }

                if ($filename -ne 'SRS.md') {
                    $rsScreenCodes = @([regex]::Matches($fileText, '\bRS-([A-Z0-9]+)-[A-Z0-9]+-[0-9]{2}\b') |
                        ForEach-Object { $_.Groups[1].Value } |
                        Sort-Object -Unique)
                    foreach ($rsScreenCode in $rsScreenCodes) {
                        if ($rsScreenCode -ne $expectedScreenCode) {
                            Add-ValidationError "Screen trace code mismatch in ${screen}/${filename}: expected $expectedScreenCode, found $rsScreenCode"
                        }
                    }
                }
            }
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Requirements validation failed with $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($validationError in $errors) {
        Write-Host "- $validationError" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Requirements validation passed." -ForegroundColor Green
Write-Host "Screen folders: $($englishScreens.Count)"
exit 0

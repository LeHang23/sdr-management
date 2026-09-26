param(
    [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Join-Path $PSScriptRoot '..\..\..'
}

$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
$frontendRoot = Join-Path $projectPath 'frontend'
$designRoot = Join-Path $projectPath 'design'
$errors = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError {
    param([string]$Message)
    $errors.Add($Message)
}

if (-not (Test-Path -LiteralPath $frontendRoot -PathType Container)) {
    Add-ValidationError "Missing frontend directory: $frontendRoot"
} else {
    $htmlFiles = @(Get-ChildItem -LiteralPath $frontendRoot -Recurse -File -Filter '*.html')
    $cssFiles = @(Get-ChildItem -LiteralPath $frontendRoot -Recurse -File -Filter '*.css')

    if ($htmlFiles.Count -eq 0) {
        Add-ValidationError 'No HTML files found in frontend.'
    }
    if ($cssFiles.Count -eq 0) {
        Add-ValidationError 'No CSS files found in frontend.'
    }

    $oldBrandPattern = 'SDR Control Center|SDR Control|Control Center'
    foreach ($file in @($htmlFiles + $cssFiles)) {
        $content = Get-Content -Raw -Encoding utf8 -LiteralPath $file.FullName
        if ($content -match $oldBrandPattern) {
            Add-ValidationError "Old product name found in: $($file.FullName)"
        }
    }

    foreach ($file in $htmlFiles) {
        $content = Get-Content -Raw -Encoding utf8 -LiteralPath $file.FullName

        if ($content -notmatch '<html\s+[^>]*lang=["'']en["'']') {
            Add-ValidationError "Missing English html lang attribute: $($file.FullName)"
        }
        if ($content -notmatch '<meta\s+[^>]*name=["'']viewport["'']') {
            Add-ValidationError "Missing viewport meta tag: $($file.FullName)"
        }
        if ($content -notmatch '<title>[^<]*SDR Management[^<]*</title>') {
            Add-ValidationError "Page title must contain SDR Management: $($file.FullName)"
        }
        if ($content -notmatch '<main(?:\s|>)') {
            Add-ValidationError "Missing semantic main element: $($file.FullName)"
        }
        if ($content -notmatch '<h1(?:\s|>)') {
            Add-ValidationError "Missing page h1: $($file.FullName)"
        }
        if ($content -match '\sstyle=["'']') {
            Add-ValidationError "Inline style attribute found: $($file.FullName)"
        }

        $stylesheetMatches = [regex]::Matches(
            $content,
            '<link\s+[^>]*rel=["'']stylesheet["''][^>]*href=["'']([^"'']+)["'']'
        )
        if ($stylesheetMatches.Count -eq 0) {
            Add-ValidationError "No stylesheet link found: $($file.FullName)"
        }
        foreach ($match in $stylesheetMatches) {
            $href = $match.Groups[1].Value
            if ($href -match '^(?:https?:)?//') {
                continue
            }
            $hrefPath = ($href -split '[?#]', 2)[0]
            $resolvedStylesheet = Join-Path $file.DirectoryName $hrefPath
            if (-not (Test-Path -LiteralPath $resolvedStylesheet -PathType Leaf)) {
                Add-ValidationError "Broken stylesheet reference in $($file.FullName): $href"
            }
        }

        $ids = @([regex]::Matches($content, '\sid=["'']([^"'']+)["'']') |
            ForEach-Object { $_.Groups[1].Value } |
            Sort-Object -Unique)
        $fragmentLinks = @([regex]::Matches($content, '\shref=["'']#([^"'']+)["'']') |
            ForEach-Object { $_.Groups[1].Value } |
            Sort-Object -Unique)
        foreach ($fragment in $fragmentLinks) {
            if ($fragment -notin $ids) {
                Add-ValidationError "Broken fragment link in $($file.FullName): #$fragment"
            }
        }
    }

    foreach ($file in $cssFiles) {
        $content = Get-Content -Raw -Encoding utf8 -LiteralPath $file.FullName
        if ($content -notmatch ':root\s*\{') {
            Add-ValidationError "CSS file does not define shared root tokens: $($file.FullName)"
        }
    }
}

if (Test-Path -LiteralPath $frontendRoot -PathType Container) {
    $scriptFiles = @(Get-ChildItem -LiteralPath $frontendRoot -Recurse -File |
        Where-Object { $_.Extension -in @('.js', '.mjs') })
    foreach ($scriptFile in $scriptFiles) {
        $scriptContent = Get-Content -Raw -Encoding utf8 -LiteralPath $scriptFile.FullName
        $imports = [regex]::Matches($scriptContent,
            '(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["''](\.{1,2}/[^"'']+)["'']')
        foreach ($import in $imports) {
            $modulePath = ($import.Groups[1].Value -split '[?#]', 2)[0]
            $resolvedModule = Join-Path $scriptFile.DirectoryName $modulePath
            if (-not (Test-Path -LiteralPath $resolvedModule -PathType Leaf)) {
                Add-ValidationError "Broken local module import in $($scriptFile.FullName): $modulePath"
            }
        }
    }
}

if (Test-Path -LiteralPath $designRoot -PathType Container) {
    $forbiddenExtensions = @('.html', '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.svg')
    $designArtifacts = @(Get-ChildItem -LiteralPath $designRoot -Recurse -File |
        Where-Object { $_.Extension.ToLowerInvariant() -in $forbiddenExtensions })
    foreach ($artifact in $designArtifacts) {
        Add-ValidationError "Implementation or export artifact found in design/: $($artifact.FullName)"
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Frontend validation failed with $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($validationError in $errors) {
        Write-Host "- $validationError" -ForegroundColor Red
    }
    exit 1
}

Write-Host 'Frontend validation passed.' -ForegroundColor Green
exit 0

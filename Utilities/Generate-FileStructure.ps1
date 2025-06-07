# Generate-FileStructure.ps1
# AcademiaOS 2.0 File Structure Generator

param(
    [string]$OutputFile = "FileStructure-Output.txt",
    [string]$RootPath = ".",
    [switch]$IncludeHidden = $false,
    [switch]$IncludeNodeModules = $false,
    [switch]$IncludeBuild = $false
)

function Write-Header {
    param([string]$Title)
    
    $separator = "=" * 80
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    @"
$separator
$Title
Generated: $timestamp
$separator

"@
}

function Get-FileTree {
    param(
        [string]$Path,
        [string]$Prefix = "",
        [int]$Depth = 0,
        [int]$MaxDepth = 10
    )
    
    if ($Depth -gt $MaxDepth) { return }
    
    try {
        $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Sort-Object Name
        
        foreach ($item in $items) {
            # Skip hidden files unless explicitly included
            if (-not $IncludeHidden -and $item.Name.StartsWith('.')) { continue }
            
            # Skip node_modules unless explicitly included
            if (-not $IncludeNodeModules -and $item.Name -eq 'node_modules') { continue }
            
            # Skip build directories unless explicitly included
            if (-not $IncludeBuild -and $item.Name -eq 'build') { continue }
            
            # Skip common ignore patterns
            if ($item.Name -match '^(\.git|\.vscode|\.idea|dist|coverage|logs|tmp)$') { continue }
            
            $isLast = $item -eq $items[-1]
            $connector = if ($isLast) { "└── " } else { "├── " }
            $newPrefix = if ($isLast) { "$Prefix    " } else { "$Prefix│   " }
            
            $itemInfo = ""
            if ($item.PSIsContainer) {
                $itemInfo = "$($item.Name)/"
                "$Prefix$connector$itemInfo"
                Get-FileTree -Path $item.FullName -Prefix $newPrefix -Depth ($Depth + 1) -MaxDepth $MaxDepth
            } else {
                $extension = $item.Extension.ToLower()
                $size = if ($item.Length -lt 1KB) { "$($item.Length)B" }
                        elseif ($item.Length -lt 1MB) { "{0:N1}KB" -f ($item.Length / 1KB) }
                        elseif ($item.Length -lt 1GB) { "{0:N1}MB" -f ($item.Length / 1MB) }
                        else { "{0:N1}GB" -f ($item.Length / 1GB) }
                
                $itemInfo = "$($item.Name) ($size)"
                "$Prefix$connector$itemInfo"
            }
        }
    }
    catch {
        "$Prefix├── Error accessing directory: $($_.Exception.Message)"
    }
}

function Get-ProjectStats {
    param([string]$RootPath)
    
    $stats = @{
        TotalFiles = 0
        TotalFolders = 0
        TypeScriptFiles = 0
        JavaScriptFiles = 0
        JsonFiles = 0
        MarkdownFiles = 0
        CssFiles = 0
        ImageFiles = 0
        ConfigFiles = 0
        TotalSize = 0
    }
    
    Get-ChildItem -Path $RootPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $stats.TotalFiles++
        $stats.TotalSize += $_.Length
        
        switch ($_.Extension.ToLower()) {
            ".ts" { $stats.TypeScriptFiles++ }
            ".tsx" { $stats.TypeScriptFiles++ }
            ".js" { $stats.JavaScriptFiles++ }
            ".jsx" { $stats.JavaScriptFiles++ }
            ".json" { $stats.JsonFiles++ }
            ".md" { $stats.MarkdownFiles++ }
            ".css" { $stats.CssFiles++ }
            {$_ -in ".png", ".gif", ".ico", ".jpg", ".jpeg", ".svg"} { $stats.ImageFiles++ }
            {$_ -in ".yml", ".yaml", ".dockerfile", ".gitignore"} { $stats.ConfigFiles++ }
        }
    }
    
    Get-ChildItem -Path $RootPath -Recurse -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $stats.TotalFolders++
    }
    
    return $stats
}

# Main execution
Write-Host "Analyzing AcademiaOS 2.0 file structure..." -ForegroundColor Cyan
Write-Host "Root Path: $(Resolve-Path $RootPath)" -ForegroundColor Green
Write-Host "Output File: $OutputFile" -ForegroundColor Green

$output = @()

# Generate header
$output += Write-Header "ACADEMIAOS 2.0 - COMPLETE FILE STRUCTURE"

# Add generation info
$output += @"
Generation Parameters:
- Root Path: $(Resolve-Path $RootPath)
- Include Hidden Files: $IncludeHidden
- Include node_modules: $IncludeNodeModules
- Include build folders: $IncludeBuild
- Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

# Generate project statistics
Write-Host "Calculating project statistics..." -ForegroundColor Yellow
$stats = Get-ProjectStats -RootPath $RootPath

$output += @"
PROJECT STATISTICS:
==================
Total Folders: $($stats.TotalFolders)
Total Files: $($stats.TotalFiles)
TypeScript Files (.ts/.tsx): $($stats.TypeScriptFiles)
JavaScript Files (.js/.jsx): $($stats.JavaScriptFiles)
JSON Files: $($stats.JsonFiles)
Markdown Files: $($stats.MarkdownFiles)
CSS Files: $($stats.CssFiles)
Image Files: $($stats.ImageFiles)
Config Files: $($stats.ConfigFiles)
Total Size: $("{0:N2} MB" -f ($stats.TotalSize / 1MB))

"@

# Generate file tree
Write-Host "Building file tree..." -ForegroundColor Yellow
$output += "FILE STRUCTURE TREE:"
$output += "==================="
$output += "$(Split-Path -Leaf (Resolve-Path $RootPath))"

$treeOutput = Get-FileTree -Path $RootPath
$output += $treeOutput

# Add footer
$output += ""
$output += "=" * 80
$output += "File structure generation completed successfully!"
$output += "Total lines in output: $($output.Count)"
$output += "=" * 80

# Write to file
try {
    $output | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "File structure saved to: $OutputFile" -ForegroundColor Green
    Write-Host "Generated $($output.Count) lines of output" -ForegroundColor Green
}
catch {
    Write-Error "Failed to write output file: $($_.Exception.Message)"
    exit 1
}

# Display summary
Write-Host "`nFile structure analysis complete!" -ForegroundColor Magenta
Write-Host "Analyzed: $($stats.TotalFolders) folders, $($stats.TotalFiles) files" -ForegroundColor White
Write-Host "Total project size: $("{0:N2} MB" -f ($stats.TotalSize / 1MB))" -ForegroundColor White
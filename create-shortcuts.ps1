$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $scriptDir "launch-desktop.vbs"
$icoPath = Join-Path $scriptDir "icons\fama.ico"

# 1. Desktop Shortcut
$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$desktopShortcutPath = Join-Path $desktopPath "SmartDash FAMA.lnk"

# 2. Start Menu Shortcut
$startMenuPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Programs)
$famaStartMenuDir = Join-Path $startMenuPath "SmartDash FAMA"
if (-not (Test-Path $famaStartMenuDir)) {
    New-Item -ItemType Directory -Path $famaStartMenuDir -Force | Out-Null
}
$startMenuShortcutPath = Join-Path $famaStartMenuDir "SmartDash FAMA.lnk"

# WScript.Shell COM object
$wsh = New-Object -ComObject WScript.Shell

# Create Desktop Shortcut
$scDesktop = $wsh.CreateShortcut($desktopShortcutPath)
$scDesktop.TargetPath = "wscript.exe"
$scDesktop.Arguments = "`"$vbsPath`""
$scDesktop.WorkingDirectory = $scriptDir
$scDesktop.IconLocation = "$icoPath,0"
$scDesktop.Description = "SmartDash FAMA - Penjejakan Arahan Ketua Pengarah FAMA"
$scDesktop.Save()

# Create Start Menu Shortcut
$scStart = $wsh.CreateShortcut($startMenuShortcutPath)
$scStart.TargetPath = "wscript.exe"
$scStart.Arguments = "`"$vbsPath`""
$scStart.WorkingDirectory = $scriptDir
$scStart.IconLocation = "$icoPath,0"
$scStart.Description = "SmartDash FAMA - Penjejakan Arahan Ketua Pengarah FAMA"
$scStart.Save()

Write-Output "Shortcuts successfully created on Desktop and Start Menu!"

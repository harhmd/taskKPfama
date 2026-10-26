$iconsDir = "C:\Users\USER\.gemini\antigravity\scratch\fama-dg-tracking\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

Add-Type -AssemblyName System.Drawing

function Create-FamaIcon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
    $c1 = [System.Drawing.ColorTranslator]::FromHtml("#0b1329")
    $c2 = [System.Drawing.ColorTranslator]::FromHtml("#1e1b4b")
    $linBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45
    $g.FillRectangle($linBrush, $rect)

    # Outer border
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#10b981")), ([Math]::Max(2, [int]($Size * 0.02)))
    $borderRect = New-Object System.Drawing.Rectangle ([int]($Size * 0.02)), ([int]($Size * 0.02)), ([int]($Size * 0.96)), ([int]($Size * 0.96))
    $g.DrawRectangle($borderPen, $borderRect)

    # Emerald badge
    $badgeRect = New-Object System.Drawing.Rectangle ([int]($Size * 0.1)), ([int]($Size * 0.1)), ([int]($Size * 0.8)), ([int]($Size * 0.8))
    $b1 = [System.Drawing.ColorTranslator]::FromHtml("#047857")
    $b2 = [System.Drawing.ColorTranslator]::FromHtml("#064e3b")
    $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $badgeRect, $b1, $b2, 90
    $g.FillEllipse($badgeBrush, $badgeRect)

    $badgePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#34d399")), ([Math]::Max(1, [int]($Size * 0.015)))
    $g.DrawEllipse($badgePen, $badgeRect)

    # Gold Accent ribbon
    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#fbbf24"))

    # Draw Text FAMA
    $fontSize = [float]($Size * 0.22)
    $fontFamily = New-Object System.Drawing.FontFamily "Arial"
    $font = New-Object System.Drawing.Font $fontFamily, $fontSize, ([System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = [System.Drawing.RectangleF]::new(0.0, [float]($Size * 0.22), [float]$Size, [float]($Size * 0.32))
    $g.DrawString("FAMA", $font, $textBrush, $textRect, $sf)

    # Subtext: SMARTDASH
    $subFontSize = [float]($Size * 0.075)
    $subFont = New-Object System.Drawing.Font $fontFamily, $subFontSize, ([System.Drawing.FontStyle]::Bold)
    $subTextRect = [System.Drawing.RectangleF]::new(0.0, [float]($Size * 0.53), [float]$Size, [float]($Size * 0.18))
    $g.DrawString("SMARTDASH", $subFont, $goldBrush, $subTextRect, $sf)

    # Tag: ARAHAN KP
    $tagFontSize = [float]($Size * 0.048)
    $tagFont = New-Object System.Drawing.Font $fontFamily, $tagFontSize, ([System.Drawing.FontStyle]::Regular)
    $whiteMutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#94a3b8"))
    $tagRect = [System.Drawing.RectangleF]::new(0.0, [float]($Size * 0.70), [float]$Size, [float]($Size * 0.15))
    $g.DrawString("ARAHAN KP", $tagFont, $whiteMutedBrush, $tagRect, $sf)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-FamaIcon -Size 512 -Path "$iconsDir\icon-512.png"
Create-FamaIcon -Size 192 -Path "$iconsDir\icon-192.png"
Create-FamaIcon -Size 64 -Path "$iconsDir\icon-64.png"
Create-FamaIcon -Size 32 -Path "$iconsDir\icon-32.png"

# Create clean Windows .ico
$iconBmp = New-Object System.Drawing.Bitmap "$iconsDir\icon-64.png"
$hIcon = $iconBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream "$iconsDir\fama.ico", ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$iconBmp.Dispose()

Write-Output "SUCCESS: Generated all SmartDash FAMA desktop icons!"

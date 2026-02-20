# Script de deploiement IIS pour DLMS Frontend
# Ce script copie automatiquement les fichiers du dossier dist vers le serveur IIS

# ============================================
# CONFIGURATION
# ============================================

# Chemin local du dossier dist
$sourceFolder = "d:\NEW DOC MANU 11102025\MES PROJETS\MES PROJETS WEB\TEST\DLMS FRONTEND\dist"

# Chemin de destination sur le serveur IIS
$destinationFolder = "C:\inetpub\wwwroot\dlms"

# Nom du site IIS
$siteName = "DLMS Frontend"

# ============================================
# SCRIPT
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Deploiement DLMS Frontend sur IIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que le dossier dist existe
if (-not (Test-Path $sourceFolder)) {
    Write-Host "X Erreur: Le dossier 'dist' n'existe pas!" -ForegroundColor Red
    Write-Host "   Veuillez executer 'npm run build:prod' d'abord." -ForegroundColor Yellow
    exit 1
}

Write-Host "v Dossier source trouve: $sourceFolder" -ForegroundColor Green

# Verifier si on a les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "! Attention: Ce script necessite des droits administrateur pour gerer IIS." -ForegroundColor Yellow
    Write-Host "   Relancez PowerShell en tant qu'administrateur." -ForegroundColor Yellow
    Write-Host ""
}

# Demander confirmation
Write-Host "Configuration du deploiement:" -ForegroundColor Cyan
Write-Host "  Source      : $sourceFolder" -ForegroundColor White
Write-Host "  Destination : $destinationFolder" -ForegroundColor White
Write-Host "  Site IIS    : $siteName" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"
if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "Deploiement annule." -ForegroundColor Yellow
    exit 0
}

# Creer le dossier de destination s'il n'existe pas
if (-not (Test-Path $destinationFolder)) {
    Write-Host "Creation du dossier de destination..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
    Write-Host "v Dossier cree: $destinationFolder" -ForegroundColor Green
}

# Arreter le site IIS si possible
if ($isAdmin) {
    try {
        Import-Module WebAdministration
        if (Test-Path "IIS:\Sites\$siteName") {
            Write-Host " Arret du site IIS: $siteName..." -ForegroundColor Yellow
            Stop-WebSite -Name $siteName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "v Site arrete" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "! Impossible d'arreter le site IIS" -ForegroundColor Yellow
    }
}

# Copier les fichiers
Write-Host "Copie des fichiers..." -ForegroundColor Yellow
try {
    # Supprimer l'ancien contenu
    if (Test-Path $destinationFolder) {
        Get-ChildItem -Path $destinationFolder -Exclude web.config | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Copier les nouveaux fichiers
    Copy-Item -Path "$sourceFolder\*" -Destination $destinationFolder -Recurse -Force
    Write-Host "v Fichiers copies avec succes!" -ForegroundColor Green
}
catch {
    Write-Host "X Erreur lors de la copie des fichiers: $_" -ForegroundColor Red
    exit 1
}

# Redemarrer le site IIS si possible
if ($isAdmin) {
    try {
        if (Test-Path "IIS:\Sites\$siteName") {
            Write-Host " Redemarrage du site IIS: $siteName..." -ForegroundColor Yellow
            Start-WebSite -Name $siteName
            Write-Host "v Site demarre" -ForegroundColor Green
        }
        else {
            Write-Host "! Le site IIS '$siteName' n'existe pas encore." -ForegroundColor Yellow
            Write-Host "   Creez-le manuellement dans IIS Manager." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "! Impossible de redemarrer le site IIS" -ForegroundColor Yellow
    }
}

# Resume
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   v DEPLOIEMENT TERMINE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  1. Verifiez que le site IIS '$siteName' existe" -ForegroundColor White
Write-Host "  2. Pool d'applications: No Managed Code" -ForegroundColor White
Write-Host "  3. URL Rewrite Module doit etre installe" -ForegroundColor White
Write-Host "  4. Testez : http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "Configuration API:" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:8182/api/" -ForegroundColor White
Write-Host ""

@echo off
chcp 65001 >nul
title Clean Wash ^& Co - Lanceur de Projet

:menu
cls
echo ===================================================
echo     CLEAN WASH ^& CO - PANNEAU DE LANCEMENT
echo ===================================================
echo.
echo 1. Lancer l'application Roulette (Next.js)
echo 2. Ouvrir le site vitrine (HTML/CSS statique)
echo 3. Quitter
echo.
set /p choix=Choisissez une option (1-3) : 

if "%choix%"=="1" goto roulette
if "%choix%"=="2" goto vitrine
if "%choix%"=="3" goto end

goto menu

:roulette
cls
echo ===================================================
echo Lancement de l'application Roulette...
echo ===================================================
cd roulette_app

echo.
echo 1/2 Verification et installation des dependances (npm install)...
call npm install

echo.
echo 2/2 Demarrage du serveur local (npm run dev)...
start http://localhost:3000
call npm run dev

cd ..
pause
goto menu

:vitrine
cls
echo ===================================================
echo Ouverture du site vitrine...
echo ===================================================
start site_clean_wash_and_co\index.html
echo.
echo Le site a ete ouvert dans votre navigateur par defaut.
pause
goto menu

:end
exit

@echo off
REM Coloca este archivo en la RAIZ de tu proyecto (junto a package.json).
REM Doble clic para correrlo, o ejecuta "sync-downloads.bat" desde cmd.
REM
REM Por defecto busca en tu carpeta de Descargas (%USERPROFILE%\Downloads).
REM Si quieres usar otra carpeta, pasala como argumento:
REM   sync-downloads.bat "C:\ruta\a\otra\carpeta"

node "%~dp0sync-downloads-v2.cjs" %1
pause

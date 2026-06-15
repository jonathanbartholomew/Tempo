@echo off
cd /d "%~dp0"
title Tempo Dev Server
call npm run dev:all

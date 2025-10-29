@echo off
echo =============================================
echo Iniciando servidor FastAPI...
echo =============================================
cd /d %~dp0
cd ..
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
pause
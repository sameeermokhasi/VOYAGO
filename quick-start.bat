@echo off
echo ========================================
echo UBER VACATION - Quick Start Guide
echo ========================================
echo.

echo [1/5] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed! Please install Python 3.9+
    pause
    exit /b 1
)

echo.
echo [2/5] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed! Please install Node.js 18+
    pause
    exit /b 1
)

echo.
echo [3/5] Checking PostgreSQL...
psql --version
if errorlevel 1 (
    echo WARNING: PostgreSQL not found in PATH. Make sure it's installed and running!
    echo Press any key to continue anyway...
    pause
)

echo.
echo ========================================
echo SETUP INSTRUCTIONS
echo ========================================
echo.
echo STEP 1: Setup Backend
echo   cd backend
echo   python -m venv venv
echo   venv\Scripts\activate
echo   pip install -r requirements.txt
echo.
echo STEP 2: Create Database
echo   Open PostgreSQL and run: CREATE DATABASE uber_clone;
echo.
echo STEP 3: Configure Environment
echo   Edit backend\.env with your database credentials
echo.
echo STEP 4: Start Backend
echo   cd backend
echo   python main.py
echo.
echo STEP 5: Setup Frontend (in new terminal)
echo   cd frontend
echo   npm install
echo   npm run dev
echo.
echo ========================================
echo Access the application:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
pause

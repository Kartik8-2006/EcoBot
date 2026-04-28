#!/bin/bash
echo "========================================"
echo "       Starting EcoBot Application"
echo "========================================"

echo ""
echo "[1/3] Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "[2/3] Installing React dependencies..."
npm install

echo ""
echo "[3/3] Starting Backend + Frontend..."
echo ""
echo " Backend  -->  http://localhost:8000"
echo " Frontend -->  http://localhost:3000"
echo ""

# Start backend in background
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
npm start

# When frontend exits, also kill backend
kill $BACKEND_PID

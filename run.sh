#!/bin/bash

# A.R.M.S. Startup Script
echo "=========================================================="
echo "  A.R.M.S. : Autonomous RAG Multi-Agent Weapon Platform"
echo "  LangChain Core + Local Vector RAG Database active."
echo "=========================================================="

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found! Creating venv..."
    python3 -m venv venv
    ./venv/bin/pip install fastapi uvicorn langchain langchain-core langchain-community
fi

echo "Starting FastAPI Server on http://localhost:8000..."
echo "To test the application, open http://localhost:8000 in your browser."
echo "Press Ctrl+C to terminate the server."
echo "----------------------------------------------------------"

# Launch uvicorn
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

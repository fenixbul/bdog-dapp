#!/bin/bash

# DFX Cold Restart Script
# Purpose: Kill all DFX processes and restart with clean state
# Usage: ./scripts/restart_dfx.sh

set -e

echo "🔄 Performing DFX cold restart..."

# Colors for better output readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Step 1: Stop DFX properly
print_info "Step 1/4: Stopping DFX..."
if dfx stop 2>/dev/null; then
    print_status "DFX stopped successfully"
else
    print_warning "DFX stop command failed (may not be running)"
fi
sleep 2

# Step 2: Kill any remaining DFX processes
print_info "Step 2/4: Killing remaining DFX processes..."
DFX_PIDS=$(pgrep -f "dfx" 2>/dev/null || true)
if [ -n "$DFX_PIDS" ]; then
    echo "$DFX_PIDS" | xargs kill -9 2>/dev/null || true
    print_status "Killed remaining DFX processes"
    sleep 1
else
    print_status "No DFX processes found"
fi

# Step 3: Kill processes on DFX ports (8080, 4943, etc.)
print_info "Step 3/4: Freeing DFX ports..."
# Port 8080 (Candid UI)
PORT_8080_PID=$(lsof -ti:8080 2>/dev/null || true)
if [ -n "$PORT_8080_PID" ]; then
    kill -9 "$PORT_8080_PID" 2>/dev/null || true
    print_status "Freed port 8080"
fi

# Port 4943 (IC HTTP Gateway)
PORT_4943_PID=$(lsof -ti:4943 2>/dev/null || true)
if [ -n "$PORT_4943_PID" ]; then
    kill -9 "$PORT_4943_PID" 2>/dev/null || true
    print_status "Freed port 4943"
fi

# Port 8000 (Replica)
PORT_8000_PID=$(lsof -ti:8000 2>/dev/null || true)
if [ -n "$PORT_8000_PID" ]; then
    kill -9 "$PORT_8000_PID" 2>/dev/null || true
    print_status "Freed port 8000"
fi

sleep 2

# Step 4: Start DFX with clean state
print_info "Step 4/4: Starting DFX with clean state..."
if dfx start --clean --background; then
    print_status "DFX started successfully"
    sleep 5
    
    # Verify it's running
    if dfx ping &>/dev/null; then
        print_status "DFX replica is responding"
    else
        print_warning "DFX started but not responding yet (may need more time)"
    fi
else
    print_error "Failed to start DFX"
    exit 1
fi

echo ""
print_status "DFX cold restart complete! 🚀"
echo ""
print_info "You can now run deployment scripts:"
echo "   ./scripts/deploy_core_local.sh"
echo ""


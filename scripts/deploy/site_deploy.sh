#!/bin/bash

# Deploy Site (Frontend Assets)
# Purpose: Build frontend and deploy site canister to local DFX replica
# Usage: ./scripts/deploy/site_deploy.sh

set -e  # Exit on any error

echo "🚀 Deploying Site (Frontend Assets)..."

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

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX is not installed. Please install DFX first:"
    echo "sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

print_status "DFX is installed ($(dfx --version))"

# Check if DFX is already running
if ! dfx ping &> /dev/null; then
    print_error "DFX replica is not running. Please start it first:"
    echo "   ./scripts/restart_dfx.sh"
    exit 1
fi

# Build frontend (Next.js)
print_status "Building frontend..."
if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
        print_info "Using pnpm to build frontend..."
        pnpm build
    elif command -v npm &> /dev/null; then
        print_info "Using npm to build frontend..."
        npm run build
    else
        print_error "No package manager found (pnpm or npm required)"
        exit 1
    fi
else
    print_error "package.json not found"
    exit 1
fi

# Check if out directory exists
if [ ! -d "out" ]; then
    print_error "Frontend build failed: 'out' directory not found"
    exit 1
fi

# Create site canister if it doesn't exist
print_status "Creating site canister..."
if dfx canister create site 2>/dev/null; then
    print_status "site canister created"
else
    print_warning "site canister may already exist"
fi

# Deploy site canister
print_status "Deploying site canister..."
if dfx deploy site; then
    print_status "site deployed successfully"
else
    print_error "Failed to deploy site"
    exit 1
fi

# Show deployed canister URL
echo ""
echo "🎉 Site deployment complete!"
echo ""
SITE_ID=$(dfx canister id site 2>/dev/null || echo "not found")
echo "📦 Site canister ID: $SITE_ID"
echo "🌐 Frontend URL: http://${SITE_ID}.localhost:8080"
echo "   Candid UI: http://localhost:8080/?canisterId=$SITE_ID"
echo ""


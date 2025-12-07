#!/bin/bash

# Deploy Internet Identity
# Purpose: Deploy internet_identity canister to local DFX replica
# Usage: ./scripts/deploy/internet_identity_deploy.sh

set -e  # Exit on any error

echo "🚀 Deploying Internet Identity..."

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

# Deploy internet_identity canister
print_status "Deploying internet_identity canister..."
if dfx deploy internet_identity; then
    print_status "internet_identity deployed successfully"
else
    print_error "Failed to deploy internet_identity"
    exit 1
fi

# Show deployed canister URL
echo ""
echo "🎉 Internet Identity deployment complete!"
echo ""
II_ID=$(dfx canister id internet_identity 2>/dev/null || echo "not found")
echo "📦 Internet Identity canister ID: $II_ID"
echo "🌐 URL: http://${II_ID}.localhost:4943"
echo ""


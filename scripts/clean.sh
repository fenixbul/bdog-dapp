#!/bin/bash

# Clean Build Artifacts
# Purpose: Remove build artifacts for fresh builds
# Usage: ./scripts/clean.sh

set -e  # Exit on any error

echo "🧹 Cleaning build artifacts..."

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

# Clean Next.js build artifacts
if [ -d ".next" ]; then
    print_info "Removing .next folder..."
    rm -rf .next
    print_status "Removed .next folder"
else
    print_info ".next folder not found (already clean)"
fi

# Clean Next.js output directory
if [ -d "out" ]; then
    print_info "Removing out folder..."
    rm -rf out
    print_status "Removed out folder"
else
    print_info "out folder not found (already clean)"
fi

# Clean DFX build artifacts
if [ -d ".dfx" ]; then
    print_warning "Cleaning .dfx build artifacts..."
    if [ -d ".dfx/local/canisters" ]; then
        rm -rf .dfx/local/canisters/*
        print_status "Cleaned canister build artifacts"
    else
        print_info ".dfx/local/canisters not found (already clean)"
    fi
else
    print_info ".dfx folder not found (already clean)"
fi

echo ""
print_status "Build artifacts cleaned successfully! 🎉"
echo ""


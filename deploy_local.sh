#!/bin/bash

# Local ICP Deployment Script
# Purpose: Deploy canisters to local DFX replica for development
# Usage: ./deploy_local.sh

set -e  # Exit on any error

echo "🚀 Starting local ICP deployment..."

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
if dfx ping &> /dev/null; then
    print_warning "DFX replica is already running"
else
    print_status "Starting DFX local replica..."
    # Start DFX in background with clean state
    # --clean: Fresh state (removes previous data)
    # --background: Run in background, don't block terminal
    dfx start --clean --background
    
    # Wait a moment for replica to fully start
    sleep 3
    
    # Verify it started successfully
    if dfx ping &> /dev/null; then
        print_status "DFX replica started successfully"
    else
        print_error "Failed to start DFX replica"
        exit 1
    fi
fi

# Clean build artifacts for fresh build
print_status "Cleaning build artifacts..."
if [ -d ".next" ]; then
    rm -rf .next
    print_status "✓ Removed .next folder"
fi

if [ -d "out" ]; then
    rm -rf out
    print_status "✓ Removed out folder"
fi

if [ -d ".dfx" ]; then
    print_warning "Cleaning .dfx build artifacts..."
    rm -rf .dfx/local/canisters/*
    print_status "✓ Cleaned canister build artifacts"
fi

# Create all canisters
print_status "Creating all canisters..."
if dfx canister create --all; then
    print_status "All canisters created successfully"
else
    print_error "Failed to create all canisters"
    exit 1
fi

# Build Motoko canisters
print_status "Building Motoko canisters..."

# Define canisters in build order (dependencies first)
MOTOKO_CANISTERS=(
    "players"
    "lobbies"
    "games"
    "skill_module"
)

for canister in "${MOTOKO_CANISTERS[@]}"; do
    print_status "Building $canister canister..."
    if dfx build "$canister"; then
        print_status "$canister built successfully"
    else
        print_error "Failed to build $canister"
        exit 1
    fi
done

# Generate TypeScript declarations for frontend integration
# Only generate for Motoko canisters (skip asset canisters like site, site_preprod)
print_status "Generating canister declarations..."
for canister in "${MOTOKO_CANISTERS[@]}"; do
    print_status "Generating declarations for $canister..."
    if dfx generate "$canister"; then
        print_status "$canister declarations generated successfully"
    else
        print_error "Failed to generate declarations for $canister"
        exit 1
    fi
done
print_status "All declarations generated successfully"

# Deploy canisters in dependency order
print_status "Deploying canisters..."
echo "📦 This will deploy:"
for canister in "${MOTOKO_CANISTERS[@]}"; do
    echo "   - $canister"
done
echo ""

# Deploy each canister
for canister in "${MOTOKO_CANISTERS[@]}"; do
    print_status "Deploying $canister canister..."
    if dfx deploy "$canister" -m reinstall --yes; then
        print_status "$canister deployed successfully"
    else
        print_error "Failed to deploy $canister"
        exit 1
    fi
done

# Set up authorization relationships
print_status "Setting up authorization relationships..."
if [ -f "./setup-authorizations.sh" ]; then
    if ./setup-authorizations.sh; then
        print_status "Authorization relationships set up successfully"
    else
        print_warning "Authorization setup script failed or returned non-zero (may be expected)"
    fi
else
    print_warning "setup-authorizations.sh not found, skipping authorization setup"
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
        print_warning "No package manager found, skipping frontend build"
    fi
else
    print_warning "package.json not found, skipping frontend build"
fi

# Deploy site (frontend assets)
print_status "Deploying site (frontend assets)..."
if dfx deploy site; then
    print_status "site deployed successfully"
else
    print_warning "Failed to deploy site (may not be configured)"
fi

print_status "All canisters deployed successfully"

# Show deployed canister URLs for easy access
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🌐 Access your application:"
SITE_ID=$(dfx canister id site 2>/dev/null || echo "not deployed")
if [ "$SITE_ID" != "not deployed" ]; then
    echo "   Frontend: http://${SITE_ID}.localhost:8080"
    echo "   Candid UI: http://localhost:8080/?canisterId=$(dfx canister id site 2>/dev/null)"
fi

echo ""
echo "📦 Deployed canisters:"
for canister in "${MOTOKO_CANISTERS[@]}"; do
    CANISTER_ID=$(dfx canister id "$canister" 2>/dev/null || echo "not found")
    echo "   $canister: $CANISTER_ID"
    echo "      Candid UI: http://localhost:8080/?canisterId=$CANISTER_ID"
done

echo ""
echo "🔐 Authorization relationships:"
print_info "Run ./setup-authorizations.sh to view or update authorizations"

echo ""
print_status "Ready for development! 🚀"
echo ""
print_info "Quick test: ./canisters/scripts/interactive_game_tool.sh"
print_info "Skill Module test: ./canisters/scripts/interactive_skill_module_tool.sh"


#!/bin/bash

# ⚠️  DEPRECATED: This script is deprecated and should not be used.
# 
# Please use individual deployment scripts instead. See scripts/README.md for
# the step-by-step setup guide:
#   1. ./scripts/restart_dfx.sh
#   2. ./scripts/deploy/players_deploy.sh
#   3. ./scripts/deploy/icrc_deploy.sh
#   4. ./scripts/deploy/skill_module_deploy.sh + ./scripts/tools/seed_bob_module.sh
#   5. ./scripts/deploy/rewards_deploy.sh
#
# This file is kept for reference only and may be removed in a future version.

# Local ICP Core Deployment Script
# Purpose: Deploy core canisters to local DFX replica for development
# Usage: ./scripts/deploy_core_local.sh
# This script orchestrates deployment by calling fragment scripts
# Note: Game canisters (lobbies, games) are deployed separately via game_deploy.sh

set -e  # Exit on any error

echo "🚀 Starting local ICP core deployment..."

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
    dfx start --clean --background
    sleep 3
    
    if dfx ping &> /dev/null; then
        print_status "DFX replica started successfully"
    else
        print_error "Failed to start DFX replica"
        exit 1
    fi
fi

# Deploy canisters using fragment scripts
print_status "Deploying core canisters using fragment scripts..."
echo ""

# Deploy players canisters
print_info "Step 1/4: Deploying players canisters..."
if ./scripts/deploy/players_deploy.sh; then
    print_status "Players canisters deployed successfully"
else
    print_error "Failed to deploy players canisters"
    exit 1
fi
echo ""

# Deploy skill module canisters
print_info "Step 2/4: Deploying skill module canisters..."
if ./scripts/deploy/skill_module_deploy.sh; then
    print_status "Skill module canisters deployed successfully"
else
    print_error "Failed to deploy skill module canisters"
    exit 1
fi
echo ""

# Deploy ICRC Token Ledgers (Local Development Only)
print_info "Step 3/4: Deploying ICRC token ledgers..."
if ./scripts/deploy/icrc_deploy.sh; then
    print_status "All ICRC tokens deployed successfully"
else
    print_error "Failed to deploy ICRC tokens"
    exit 1
fi
echo ""

# Deploy Internet Identity
print_status "Deploying internet_identity canister..."
if dfx deploy internet_identity; then
    print_status "internet_identity deployed successfully"
else
    print_error "Failed to deploy internet_identity"
    exit 1
fi
echo ""

# Set up authorization relationships
print_info "Step 4/4: Setting up authorization relationships..."
if [ -f "./scripts/setup-authorizations.sh" ]; then
    if ./scripts/setup-authorizations.sh; then
        print_status "Authorization relationships set up successfully"
    else
        print_warning "Authorization setup script failed or returned non-zero (may be expected)"
    fi
else
    print_warning "scripts/setup-authorizations.sh not found, skipping authorization setup"
fi
echo ""

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

print_status "All core canisters deployed successfully"

# Show deployed canister URLs for easy access
echo ""
echo "🎉 Core deployment complete!"
echo ""
echo "🌐 Access your application:"
SITE_ID=$(dfx canister id site 2>/dev/null || echo "not deployed")
if [ "$SITE_ID" != "not deployed" ]; then
    echo "   Frontend: http://${SITE_ID}.localhost:8080"
    echo "   Candid UI: http://localhost:8080/?canisterId=$(dfx canister id site 2>/dev/null)"
fi

echo ""
echo "📦 Deployed core canisters:"
CORE_CANISTERS=("players" "skill_module")
for canister in "${CORE_CANISTERS[@]}"; do
    CANISTER_ID=$(dfx canister id "$canister" 2>/dev/null || echo "not found")
    echo "   $canister: $CANISTER_ID"
    echo "      Candid UI: http://localhost:8080/?canisterId=$CANISTER_ID"
done
II_ID=$(dfx canister id internet_identity 2>/dev/null || echo "not found")
echo "   internet_identity: $II_ID"
echo "      URL: http://${II_ID}.localhost:4943"
echo ""
echo "🪙 Token Ledgers (Local Development):"
ICP_CANISTER_ID="ryjl3-tyaaa-aaaaa-aaaba-cai"
BOB_CANISTER_ID="7pail-xaaaa-aaaas-aabmq-cai"
BDOG_CANISTER_ID="2qqix-tiaaa-aaaam-qeria-cai"
echo "   ICP: $ICP_CANISTER_ID"
echo "      Candid UI: http://localhost:8080/?canisterId=$ICP_CANISTER_ID"
echo "   BOB: $BOB_CANISTER_ID"
echo "      Candid UI: http://localhost:8080/?canisterId=$BOB_CANISTER_ID"
echo "   BDOG: $BDOG_CANISTER_ID"
echo "      Candid UI: http://localhost:8080/?canisterId=$BDOG_CANISTER_ID"

echo ""
echo "🔐 Authorization relationships:"
print_info "Run ./scripts/setup-authorizations.sh to view or update authorizations"

echo ""
print_status "Core deployment ready! 🚀"
echo ""
print_info "To deploy game canisters separately, run: ./scripts/deploy/game_deploy.sh"
print_info "Quick test: ./scripts/tools/interactive_game_tool.sh"
print_info "Skill Module test: ./scripts/tools/interactive_skill_module_tool.sh"
echo ""



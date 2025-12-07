#!/bin/bash

# Deploy Game Canisters
# Purpose: Deploy game-related canisters to local DFX replica
# Usage: ./scripts/deploy/game_deploy.sh

set -e  # Exit on any error

echo "🚀 Deploying Game Canisters..."

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

# Define canisters in build order (dependencies first)
# lobbies must be deployed before games
# Can be extended in the future to add more game-related canisters
CANISTERS=(
    "lobbies"
    "games"
)

# Create canisters
print_status "Creating canisters..."
for canister in "${CANISTERS[@]}"; do
    if dfx canister create "$canister" 2>/dev/null; then
        print_status "$canister canister created"
    else
        print_warning "$canister canister may already exist"
    fi
done

# Build Motoko canisters
print_status "Building canisters..."
for canister in "${CANISTERS[@]}"; do
    print_status "Building $canister canister..."
    if dfx build "$canister"; then
        print_status "$canister built successfully"
    else
        print_error "Failed to build $canister"
        exit 1
    fi
done

# Generate TypeScript declarations for frontend integration
print_status "Generating canister declarations..."
for canister in "${CANISTERS[@]}"; do
    print_status "Generating declarations for $canister..."
    if dfx generate "$canister"; then
        print_status "$canister declarations generated successfully"
    else
        print_error "Failed to generate declarations for $canister"
        exit 1
    fi
done
print_status "All declarations generated successfully"

# Deploy canisters
print_status "Deploying canisters..."
echo "📦 This will deploy:"
for canister in "${CANISTERS[@]}"; do
    echo "   - $canister"
done
echo ""

for canister in "${CANISTERS[@]}"; do
    print_status "Deploying $canister canister..."
    if dfx deploy "$canister" -m reinstall --yes; then
        print_status "$canister deployed successfully"
    else
        print_error "Failed to deploy $canister"
        exit 1
    fi
done

print_status "All game canisters deployed successfully"

# Show deployed canister URLs
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📦 Deployed canisters:"
for canister in "${CANISTERS[@]}"; do
    CANISTER_ID=$(dfx canister id "$canister" 2>/dev/null || echo "not found")
    echo "   $canister: $CANISTER_ID"
    echo "      Candid UI: http://localhost:8080/?canisterId=$CANISTER_ID"
done
echo ""



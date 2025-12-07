#!/bin/bash

# Deploy Players Canisters
# Purpose: Deploy user-related canisters to local DFX replica
# Usage: ./scripts/deploy/players_deploy.sh

set -e  # Exit on any error

echo "🚀 Deploying Players Canisters..."

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
# Can be extended in the future to add more user-related canisters
CANISTERS=(
    "players"
    "player_manager"
)

# Process each canister: create -> build -> generate
# This ensures each canister is fully processed before moving to the next
# to avoid "canister alias not defined" errors
print_status "Processing canisters (create -> build -> generate)..."
for canister in "${CANISTERS[@]}"; do
    echo ""
    print_info "Processing $canister canister..."
    
    # Create canister
    print_status "Creating $canister canister..."
    if dfx canister create "$canister" 2>/dev/null; then
        print_status "$canister canister created"
    else
        print_warning "$canister canister may already exist"
    fi
    
    # Build canister
    print_status "Building $canister canister..."
    if dfx build "$canister"; then
        print_status "$canister built successfully"
    else
        print_error "Failed to build $canister"
        exit 1
    fi
    
    # Generate declarations
    print_status "Generating declarations for $canister..."
    if dfx generate "$canister"; then
        print_status "$canister declarations generated successfully"
    else
        print_error "Failed to generate declarations for $canister"
        exit 1
    fi
    
    print_status "$canister processing complete ✓"
done
echo ""
print_status "All canisters processed successfully"

# Deploy canisters
print_status "Deploying canisters..."
echo "📦 This will deploy:"
for canister in "${CANISTERS[@]}"; do
    echo "   - $canister"
done
echo ""

for canister in "${CANISTERS[@]}"; do
    print_status "Deploying $canister canister..."
    if dfx deploy "$canister" --mode reinstall --yes; then
        print_status "$canister deployed successfully"
    else
        print_error "Failed to deploy $canister"
        exit 1
    fi
done

print_status "All players canisters deployed successfully"

# Set up authorization relationships
echo ""
print_info "Setting up authorization relationships..."
print_status "Getting canister principals..."

PLAYER_MANAGER_ID=$(dfx canister id player_manager 2>/dev/null || echo "")
PLAYERS_ID=$(dfx canister id players 2>/dev/null || echo "")

if [ -z "$PLAYER_MANAGER_ID" ]; then
    print_error "player_manager canister not found. Please deploy canisters first."
    exit 1
fi

if [ -z "$PLAYERS_ID" ]; then
    print_error "players canister not found. Please deploy canisters first."
    exit 1
fi

print_info "Canister IDs:"
echo "   players: $PLAYERS_ID"
echo "   player_manager: $PLAYER_MANAGER_ID"
echo ""

# Authorize player_manager to call players canister
print_status "Adding player_manager → players authorization..."
print_info "   Reason: Player manager needs to call players canister methods"

if dfx canister call players addAuthorizedPrincipal "(principal \"$PLAYER_MANAGER_ID\")" &> /dev/null; then
    print_status "✓ player_manager → players authorized"
else
    print_error "Failed to authorize player_manager for players"
    print_error "Command: dfx canister call players addAuthorizedPrincipal \"(principal \\\"$PLAYER_MANAGER_ID\\\")\""
    exit 1
fi

echo ""
print_status "All authorization relationships set up successfully!"
echo ""

echo "🔐 Authorization Summary:"
echo "   player_manager → players ✓"
echo ""

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



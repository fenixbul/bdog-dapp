#!/bin/bash

# Authorization Setup Script
# Purpose: Set up authorization relationships between canisters
# Usage: ./setup-authorizations.sh
# Can be called independently or from other deployment scripts

set -e  # Exit on any error

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

# Check if DFX is running
if ! dfx ping &> /dev/null; then
    print_error "DFX replica is not running. Please start it first:"
    echo "dfx start --background"
    exit 1
fi

print_info "Setting up authorization relationships between canisters..."

# Get canister principals
print_status "Getting canister principals..."

PLAYERS_ID=$(dfx canister id players 2>/dev/null || echo "")
LOBBIES_ID=$(dfx canister id lobbies 2>/dev/null || echo "")
GAMES_ID=$(dfx canister id games 2>/dev/null || echo "")

if [ -z "$PLAYERS_ID" ]; then
    print_error "players canister not found. Please deploy canisters first."
    exit 1
fi

if [ -z "$LOBBIES_ID" ]; then
    print_error "lobbies canister not found. Please deploy canisters first."
    exit 1
fi

if [ -z "$GAMES_ID" ]; then
    print_error "games canister not found. Please deploy canisters first."
    exit 1
fi

print_info "Canister IDs:"
echo "   players: $PLAYERS_ID"
echo "   lobbies: $LOBBIES_ID"
echo "   games: $GAMES_ID"
echo ""

# Define authorization relationships
# Format: "caller_canister:target_canister:description"
# Example: If lobbies needs to call players.create_player, add "$LOBBIES_ID:players:Lobbies can create players"
# Example: If games needs to call players to update stats, add "$GAMES_ID:players:Games can update player stats"

AUTHORIZATIONS=(
    # Add authorization relationships here as needed
    # "$LOBBIES_ID:players:Lobbies can create players"
    # "$GAMES_ID:players:Games can update player stats"
)

# If no authorizations are defined, show info and exit
if [ ${#AUTHORIZATIONS[@]} -eq 0 ]; then
    print_info "No authorization relationships defined."
    print_info "To add authorizations, edit this script and add entries to the AUTHORIZATIONS array."
    echo ""
    print_info "Example format:"
    echo "   AUTHORIZATIONS=("
    echo "       \"\$LOBBIES_ID:players:Lobbies can create players\""
    echo "       \"\$GAMES_ID:players:Games can update player stats\""
    echo "   )"
    echo ""
    exit 0
fi

# Set up authorization relationships
print_status "Setting up authorization relationships..."
echo ""

for auth in "${AUTHORIZATIONS[@]}"; do
    # Split the string into caller_id, target, and description
    IFS=':' read -r caller_id target description <<< "$auth"
    
    # Get target canister name
    target_name=""
    case "$target" in
        "players") target_name="players" ;;
        "lobbies") target_name="lobbies" ;;
        "games") target_name="games" ;;
        *) target_name="unknown" ;;
    esac
    
    # Get caller canister name for better logging
    caller_name=""
    case "$caller_id" in
        "$PLAYERS_ID") caller_name="players" ;;
        "$LOBBIES_ID") caller_name="lobbies" ;;
        "$GAMES_ID") caller_name="games" ;;
        *) caller_name="unknown" ;;
    esac
    
    print_status "Adding $caller_name → $target_name authorization..."
    if [ -n "$description" ]; then
        print_info "   Reason: $description"
    fi
    
    if dfx canister call "$target" addAuthorizedPrincipal "(principal \"$caller_id\")" &> /dev/null; then
        print_status "✓ $caller_name → $target_name authorized"
    else
        print_error "Failed to authorize $caller_name for $target_name"
        print_error "Command: dfx canister call $target addAuthorizedPrincipal \"(principal \\\"$caller_id\\\")\""
        exit 1
    fi
done

echo ""
print_status "All authorization relationships set up successfully!"
echo ""

echo "🔐 Authorization Summary:"
for auth in "${AUTHORIZATIONS[@]}"; do
    IFS=':' read -r caller_id target description <<< "$auth"
    caller_name=""
    case "$caller_id" in
        "$PLAYERS_ID") caller_name="players" ;;
        "$LOBBIES_ID") caller_name="lobbies" ;;
        "$GAMES_ID") caller_name="games" ;;
        *) caller_name="unknown" ;;
    esac
    echo "   $caller_name → $target ✓"
done
echo ""

print_info "Authorization setup complete! 🚀"


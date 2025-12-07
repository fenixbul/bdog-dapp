#!/bin/bash

# Verification Module Deployment Script
# Purpose: Deploy verification canister to local DFX replica or IC mainnet
# Usage: NETWORK=[local|ic] ./deploy.sh API_KEY [AUTHORIZED_PRINCIPALS]
# 
# Examples:
#   ./deploy.sh "your-api-key"                                    # Deploy to local with API key (default)
#   NETWORK=ic ./deploy.sh "your-api-key"                         # Deploy to IC mainnet with API key
#   ./deploy.sh "your-api-key" "principal1,principal2"            # Deploy to local with API key + authorized principals
#   NETWORK=ic ./deploy.sh "your-api-key" "principal1,principal2" # Deploy to IC with API key + authorized principals

set -e  # Exit on any error

echo "🚀 Starting Verification deployment..."

# Colors for better output readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Parse command line arguments
API_KEY="${1:-}"  # Required API key
AUTHORIZED_PRINCIPALS="${2:-}"  # Optional authorized principals (comma-separated)



# Check if API key is provided
if [ -z "$API_KEY" ]; then
    print_error "API_KEY is required!"
    echo "Usage: ./deploy.sh API_KEY [AUTHORIZED_PRINCIPALS]"
    echo "Examples:"
    echo "  ./deploy.sh \"your-api-key\""
    echo "  ./deploy.sh \"your-api-key\" \"principal1,principal2\""
    exit 1
fi

# Set network (change to "ic" for mainnet, or set via NETWORK environment variable)
NETWORK="${NETWORK:-local}"

# Build network flag array for dfx commands (empty for local, --network for others)
if [ "$NETWORK" = "local" ]; then
    DFX_NETWORK_ARGS=()
else
    DFX_NETWORK_ARGS=("--network" "$NETWORK")
fi

echo "📋 Configuration:"
echo "   Network: $NETWORK"
echo "   API Key: ${API_KEY:0:8}..."  # Show only first 8 chars for security
echo "   Authorized Principals: player_manager (auto)${AUTHORIZED_PRINCIPALS:+, $AUTHORIZED_PRINCIPALS}"
echo ""

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX is not installed. Please install DFX first:"
    echo "sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

print_status "DFX is installed ($(dfx --version))"

# Check if DFX is already running (only for local network)
if [ "$NETWORK" = "local" ]; then
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
else
    print_status "Using network: $NETWORK (skipping local replica start)"
fi

# Create verification canister
print_status "Creating verification canister..."
if dfx canister create verification "${DFX_NETWORK_ARGS[@]}"; then
    print_status "verification canister created successfully"
else
    print_error "Failed to create verification canister"
    exit 1
fi

# Deploy with configuration
print_status "Deploying verification with configuration..."
if dfx deploy verification "${DFX_NETWORK_ARGS[@]}" --argument "(
  record {
    apiKey = \"$API_KEY\";
    apiHost = \"api.socialdata.tools\";
    verificationMessage = \"My code is {code}\";
    maxAttempts = 3;
    processingIntervalSeconds = 120;
    maxAttemptsPerHour = 5;
  }
)" -m reinstall --yes; then
    print_status "verification deployed successfully"
else
    print_error "Failed to deploy verification"
    exit 1
fi

# Set up authorized principals
print_status "Setting up authorized principals..."

# Get player_manager canister ID and add it automatically
print_status "Getting player_manager canister ID..."
PLAYER_MANAGER_ID=$(dfx canister id player_manager "${DFX_NETWORK_ARGS[@]}" 2>/dev/null || echo "")
if [ -n "$PLAYER_MANAGER_ID" ]; then
    print_status "Adding player_manager canister: $PLAYER_MANAGER_ID"
    if dfx canister call verification "${DFX_NETWORK_ARGS[@]}" addAuthorizedPrincipal "(principal \"$PLAYER_MANAGER_ID\")"; then
        print_status "✓ Added player_manager"
    else
        print_warning "⚠ Failed to add player_manager"
    fi
else
    print_warning "⚠ player_manager canister not found, skipping"
fi

# Add user-provided authorized principals if any
if [ -n "$AUTHORIZED_PRINCIPALS" ]; then
    # Split authorized principals by comma and add each one
    IFS=',' read -ra PRINCIPALS <<< "$AUTHORIZED_PRINCIPALS"
    for principal in "${PRINCIPALS[@]}"; do
        # Trim whitespace
        principal=$(echo "$principal" | xargs)
        if [ -n "$principal" ]; then
            print_status "Adding authorized principal: $principal"
            if dfx canister call verification "${DFX_NETWORK_ARGS[@]}" addAuthorizedPrincipal "(principal \"$principal\")"; then
                print_status "✓ Added $principal"
            else
                print_warning "⚠ Failed to add $principal"
            fi
        fi
    done
fi

# Generate TypeScript declarations
print_status "Generating TypeScript declarations..."
if dfx generate verification "${DFX_NETWORK_ARGS[@]}"; then
    print_status "Declarations generated successfully"
else
    print_error "Failed to generate declarations"
    exit 1
fi

print_status "Verification deployment complete!"

# Show deployed canister info
CANISTER_ID=$(dfx canister id verification "${DFX_NETWORK_ARGS[@]}")
echo ""
echo "🎉 Verification Module Deployed!"
echo ""
echo "📦 Canister Details:"
echo "   Canister ID: $CANISTER_ID"
if [ "$NETWORK" = "local" ]; then
    echo "   Candid UI: http://localhost:4943/?canisterId=$CANISTER_ID"
else
    echo "   Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app/?id=$CANISTER_ID"
fi
echo ""
echo "🔧 Configuration:"
echo "   API Key: ${API_KEY:0:8}..."
echo "   API Host: api.socialdata.tools"
echo "   Message: My code is {code}"
echo "   Max Attempts: 3 (per account - lifetime)"
echo "   Processing Interval: 120 seconds"
echo "   Max Attempts Per Hour: 5 (per hour per principal)"
if [ -n "$PLAYER_MANAGER_ID" ]; then
    if [ -n "$AUTHORIZED_PRINCIPALS" ]; then
        echo "   Authorized Principals: $PLAYER_MANAGER_ID (player_manager), $AUTHORIZED_PRINCIPALS"
    else
        echo "   Authorized Principals: $PLAYER_MANAGER_ID (player_manager)"
    fi
elif [ -n "$AUTHORIZED_PRINCIPALS" ]; then
    echo "   Authorized Principals: $AUTHORIZED_PRINCIPALS"
fi
echo ""
echo "📚 Usage Example:"
DEPLOYER_PRINCIPAL_EXAMPLE=$(dfx identity get-principal "${DFX_NETWORK_ARGS[@]}")
NETWORK_FLAG_STR="${DFX_NETWORK_ARGS[*]}"
echo "   # Get verification code"
echo "   dfx canister call verification $NETWORK_FLAG_STR getVerificationCode '(principal \"$DEPLOYER_PRINCIPAL_EXAMPLE\")'"
echo ""
echo "   # Trigger verification"
echo "   dfx canister call verification $NETWORK_FLAG_STR triggerVerification '(principal \"$DEPLOYER_PRINCIPAL_EXAMPLE\", \"TWEET_ID\")'"
echo ""
echo "   # Check status"
echo "   dfx canister call verification $NETWORK_FLAG_STR getVerificationStatus '(principal \"$DEPLOYER_PRINCIPAL_EXAMPLE\")'"
echo ""
echo "🛠️  Development Commands:"
if [ "$NETWORK" = "local" ]; then
    echo "   View logs:           dfx replica --logs"
    echo "   Stop replica:        dfx stop"
fi
echo "   Redeploy:            NETWORK=$NETWORK ./deploy.sh \"$API_KEY\" \"$AUTHORIZED_PRINCIPALS\""
echo "   Test verification:   dfx canister call verification $NETWORK_FLAG_STR getVerificationCode '(principal \"$DEPLOYER_PRINCIPAL_EXAMPLE\")'"
echo "   Add authorized:      dfx canister call verification $NETWORK_FLAG_STR addAuthorizedPrincipal '(principal \"PRINCIPAL_ID\")'"
echo "   List authorized:     dfx canister call verification $NETWORK_FLAG_STR getAuthorizedPrincipals"
echo ""
print_status "Ready for verification! 🚀"

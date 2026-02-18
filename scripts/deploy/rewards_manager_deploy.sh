#!/bin/bash

# Deploy Rewards Manager System
# Purpose: Deploy, configure, and fund rewards_manager canister for local development
# Usage: ./scripts/deploy/rewards_manager_deploy.sh

set -e

echo "🚀 Deploying Rewards Manager System..."

# Colors for output
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

# Define canister
CANISTER="rewards_manager"

# Token canister IDs
ICP_CANISTER_ID="ryjl3-tyaaa-aaaaa-aaaba-cai"
BOB_CANISTER_ID="7pail-xaaaa-aaaas-aabmq-cai"
BDOG_CANISTER_ID="2qqix-tiaaa-aaaam-qeria-cai"

# Reward configuration (amounts in atomic units, 8 decimals)
# 50 BDOG tokens = 50_000_000_000 atomic units
USER_VERIFIED_AMOUNT="50000000000"
# 100 BDOG tokens = 100_000_000_000 atomic units
MODULE_PASSED_AMOUNT="100000000000"

# Initial funding amount (1_000 BDOG tokens = 1_000_000_000_000 atomic units)
INITIAL_FUNDING_AMOUNT="1000000000000"

# Create canister
print_status "Creating canister..."
if dfx canister create "$CANISTER" 2>/dev/null; then
    print_status "$CANISTER canister created"
else
    print_warning "$CANISTER canister may already exist"
fi

# Build rewards_manager canister
print_status "Building rewards_manager canister..."
if dfx build "$CANISTER"; then
    print_status "Rewards manager canister built successfully"
else
    print_error "Failed to build rewards_manager canister"
    exit 1
fi

print_status "Generating declarations..."
if dfx generate "$CANISTER"; then
    print_status "Declarations generated successfully"
else
    print_error "Failed to generate declarations"
    exit 1
fi

print_status "Deploying rewards_manager canister..."
if dfx deploy "$CANISTER" -m reinstall --yes; then
    print_status "Rewards manager canister deployed successfully"
else
    print_error "Failed to deploy rewards_manager canister"
    exit 1
fi

REWARDS_MANAGER_ID=$(dfx canister id "$CANISTER")
print_status "Rewards manager canister ID: $REWARDS_MANAGER_ID"
echo ""

# Step 2: Get verification canister IDs
print_status "Getting verification canister IDs..."
PLAYERS_ID=$(dfx canister id players 2>/dev/null || echo "")
SKILL_MODULE_ID=$(dfx canister id skill_module 2>/dev/null || echo "")

if [ -z "$PLAYERS_ID" ]; then
    print_error "Players canister not found. Please deploy it first:"
    echo "   ./scripts/deploy/players_deploy.sh"
    exit 1
fi

if [ -z "$SKILL_MODULE_ID" ]; then
    print_error "Skill module canister not found. Please deploy it first:"
    echo "   ./scripts/deploy/skill_module_deploy.sh"
    exit 1
fi

print_status "Verification canisters found:"
print_info "  Players: $PLAYERS_ID"
print_info "  Skill Module: $SKILL_MODULE_ID"
echo ""

# Step 3: Register tokens
print_status "Registering tokens..."
for TOKEN_ID in "$ICP_CANISTER_ID" "$BOB_CANISTER_ID" "$BDOG_CANISTER_ID"; do
    if dfx canister call "$CANISTER" registerToken "(principal \"$TOKEN_ID\")" > /dev/null 2>&1; then
        print_status "Token registered: $TOKEN_ID"
    else
        print_warning "Failed to register token: $TOKEN_ID (may already be registered)"
    fi
done
echo ""

# Step 4: Set reward configurations (with verification canister IDs)
print_status "Setting reward configurations..."

# UserVerified reward (50 BDOG) - verified by players canister
if dfx canister call "$CANISTER" setRewardConfig "(record {
  rewardType = variant { UserVerified };
  token = principal \"$BDOG_CANISTER_ID\";
  amount = $USER_VERIFIED_AMOUNT : nat;
  verificationCanisterId = principal \"$PLAYERS_ID\";
})" > /dev/null 2>&1; then
    print_status "UserVerified reward configured: 50 BDOG (verified by players)"
else
    print_error "Failed to set UserVerified reward config"
    exit 1
fi

# ModulePassed reward (100 BDOG) - verified by skill_module canister
if dfx canister call "$CANISTER" setRewardConfig "(record {
  rewardType = variant { ModulePassed };
  token = principal \"$BDOG_CANISTER_ID\";
  amount = $MODULE_PASSED_AMOUNT : nat;
  verificationCanisterId = principal \"$SKILL_MODULE_ID\";
})" > /dev/null 2>&1; then
    print_status "ModulePassed reward configured: 100 BDOG (verified by skill_module)"
else
    print_error "Failed to set ModulePassed reward config"
    exit 1
fi
echo ""

# Step 5: Fund rewards_manager canister
print_status "Funding rewards_manager canister with BDOG tokens..."
print_info "Transferring $INITIAL_FUNDING_AMOUNT atomic units (1000 BDOG tokens) to rewards_manager canister..."

TRANSFER_RESULT=$(dfx canister call "$BDOG_CANISTER_ID" icrc1_transfer "(record {
  to = record {
    owner = principal \"$REWARDS_MANAGER_ID\";
    subaccount = null;
  };
  amount = $INITIAL_FUNDING_AMOUNT : nat;
  fee = null;
  memo = opt (vec {});
  from_subaccount = null;
  created_at_time = null;
})" 2>&1)

if echo "$TRANSFER_RESULT" | grep -q "Ok"; then
    print_status "Rewards manager canister funded successfully"
else
    print_warning "Transfer may have failed. Check your balance and try manually:"
    echo "   dfx canister call $BDOG_CANISTER_ID icrc1_transfer '(record {"
    echo "     to = record { owner = principal \"$REWARDS_MANAGER_ID\"; subaccount = null; };"
    echo "     amount = $INITIAL_FUNDING_AMOUNT : nat;"
    echo "     fee = null; memo = opt (vec {});"
    echo "     from_subaccount = null; created_at_time = null;"
    echo "   })'"
fi
echo ""

# Step 6: Verify setup
print_status "Verifying setup..."

# Check rewards_manager canister balance
BALANCE=$(dfx canister call "$BDOG_CANISTER_ID" icrc1_balance_of "(record { owner = principal \"$REWARDS_MANAGER_ID\"; })" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
if [ "$BALANCE" != "0" ]; then
    print_status "Rewards manager canister balance: $BALANCE atomic units"
else
    print_warning "Rewards manager canister balance is 0. Please fund it manually."
fi

# Summary
echo "🎉 Rewards Manager System Deployment Complete!"
echo ""
echo "📦 Canister IDs:"
echo "   Rewards Manager: $REWARDS_MANAGER_ID"
echo "   Players: $PLAYERS_ID"
echo "   Skill Module: $SKILL_MODULE_ID"
echo ""
echo "🪙 Token Canisters:"
echo "   ICP:  $ICP_CANISTER_ID"
echo "   BOB:  $BOB_CANISTER_ID"
echo "   BDOG: $BDOG_CANISTER_ID"
echo ""
echo "💰 Reward Configuration:"
echo "   UserVerified: 50 BDOG tokens (verified by players)"
echo "   ModulePassed: 100 BDOG tokens (verified by skill_module)"
echo ""
echo "🌐 Candid UI:"
echo "   http://localhost:8080/?canisterId=$REWARDS_MANAGER_ID"
echo ""
print_info "Users can now claim rewards using:"
echo "   dfx canister call rewards_manager claimReward '(variant { UserVerified })'"
echo "   dfx canister call rewards_manager claimReward '(variant { ModulePassed })'"
echo ""
print_info "For more information, see: canisters/REWARDS_MANAGER.md"
echo ""





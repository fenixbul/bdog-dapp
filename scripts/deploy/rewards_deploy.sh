#!/bin/bash

# Deploy Rewards System
# Purpose: Deploy, configure, and fund rewards canister for local development
# Usage: ./scripts/deploy/rewards_deploy.sh

set -e

echo "🚀 Deploying Rewards System..."

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

# Define canisters (can be extended in the future)
CANISTERS=(
    "rewards"
)

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

# Create canisters
print_status "Creating canisters..."
for canister in "${CANISTERS[@]}"; do
    if dfx canister create "$canister" 2>/dev/null; then
        print_status "$canister canister created"
    else
        print_warning "$canister canister may already exist"
    fi
done

# Build rewards canister
print_status "Building rewards canister..."
if dfx build rewards; then
    print_status "Rewards canister built successfully"
else
    print_error "Failed to build rewards canister"
    exit 1
fi

print_status "Generating declarations..."
if dfx generate rewards; then
    print_status "Declarations generated successfully"
else
    print_error "Failed to generate declarations"
    exit 1
fi

print_status "Deploying rewards canister..."
if dfx deploy rewards -m reinstall --yes; then
    print_status "Rewards canister deployed successfully"
else
    print_error "Failed to deploy rewards canister"
    exit 1
fi

REWARDS_ID=$(dfx canister id rewards)
print_status "Rewards canister ID: $REWARDS_ID"
echo ""

# Step 3: Configure canister IDs
print_status "Configuring canister IDs..."
PLAYERS_ID=$(dfx canister id players 2>/dev/null || echo "")
SKILL_MODULE_ID=$(dfx canister id skill_module 2>/dev/null || echo "")

if [ -z "$PLAYERS_ID" ]; then
    print_error "Players canister not found. Please deploy it first."
    exit 1
fi

if [ -z "$SKILL_MODULE_ID" ]; then
    print_error "Skill module canister not found. Please deploy it first."
    exit 1
fi

if dfx canister call rewards setPlayersCanisterId "(principal \"$PLAYERS_ID\")" > /dev/null 2>&1; then
    print_status "Players canister ID set"
else
    print_error "Failed to set players canister ID"
    exit 1
fi

if dfx canister call rewards setSkillModuleCanisterId "(principal \"$SKILL_MODULE_ID\")" > /dev/null 2>&1; then
    print_status "Skill module canister ID set"
else
    print_error "Failed to set skill module canister ID"
    exit 1
fi
echo ""

# Step 4: Register tokens
print_status "Registering tokens..."
for TOKEN_ID in "$ICP_CANISTER_ID" "$BOB_CANISTER_ID" "$BDOG_CANISTER_ID"; do
    if dfx canister call rewards registerToken "(principal \"$TOKEN_ID\")" > /dev/null 2>&1; then
        print_status "Token registered: $TOKEN_ID"
    else
        print_warning "Failed to register token: $TOKEN_ID (may already be registered)"
    fi
done
echo ""

# Step 5: Set reward configurations
print_status "Setting reward configurations..."

# UserVerified reward (50 BDOG)
if dfx canister call rewards setRewardConfig "(record {
  rewardType = variant { UserVerified };
  token = principal \"$BDOG_CANISTER_ID\";
  amount = $USER_VERIFIED_AMOUNT : nat;
})" > /dev/null 2>&1; then
    print_status "UserVerified reward configured: 50 BDOG"
else
    print_error "Failed to set UserVerified reward config"
    exit 1
fi

# ModulePassed reward (100 BDOG)
if dfx canister call rewards setRewardConfig "(record {
  rewardType = variant { ModulePassed };
  token = principal \"$BDOG_CANISTER_ID\";
  amount = $MODULE_PASSED_AMOUNT : nat;
})" > /dev/null 2>&1; then
    print_status "ModulePassed reward configured: 100 BDOG"
else
    print_error "Failed to set ModulePassed reward config"
    exit 1
fi
echo ""

# Step 6: Fund rewards canister
print_status "Funding rewards canister with BDOG tokens..."
print_info "Transferring $INITIAL_FUNDING_AMOUNT atomic units (1000 BDOG tokens) to rewards canister..."

TRANSFER_RESULT=$(dfx canister call "$BDOG_CANISTER_ID" icrc1_transfer "(record {
  to = record {
    owner = principal \"$REWARDS_ID\";
    subaccount = null;
  };
  amount = $INITIAL_FUNDING_AMOUNT : nat;
  fee = null;
  memo = opt (vec {});
  from_subaccount = null;
  created_at_time = null;
})" 2>&1)

if echo "$TRANSFER_RESULT" | grep -q "Ok"; then
    print_status "Rewards canister funded successfully"
else
    print_warning "Transfer may have failed. Check your balance and try manually:"
    echo "   dfx canister call $BDOG_CANISTER_ID icrc1_transfer '(record {"
    echo "     to = record { owner = principal \"$REWARDS_ID\"; subaccount = null; };"
    echo "     amount = $INITIAL_FUNDING_AMOUNT : nat;"
    echo "     fee = null; memo = opt (vec {});"
    echo "     from_subaccount = null; created_at_time = null;"
    echo "   })'"
fi
echo ""

# Step 7: Verify setup
print_status "Verifying setup..."

# Check rewards canister balance
BALANCE=$(dfx canister call "$BDOG_CANISTER_ID" icrc1_balance_of "(record { owner = principal \"$REWARDS_ID\"; })" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
if [ "$BALANCE" != "0" ]; then
    print_status "Rewards canister balance: $BALANCE atomic units"
else
    print_warning "Rewards canister balance is 0. Please fund it manually."
fi


# Summary
echo "🎉 Rewards System Deployment Complete!"
echo ""
echo "📦 Canister IDs:"
echo "   Rewards: $REWARDS_ID"
echo "   Players: $PLAYERS_ID"
echo "   Skill Module: $SKILL_MODULE_ID"
echo ""
echo "🪙 Token Canisters:"
echo "   ICP:  $ICP_CANISTER_ID"
echo "   BOB:  $BOB_CANISTER_ID"
echo "   BDOG: $BDOG_CANISTER_ID"
echo ""
echo "💰 Reward Configuration:"
echo "   UserVerified: 50 BDOG tokens"
echo "   ModulePassed: 100 BDOG tokens"
echo ""
echo "🌐 Candid UI:"
echo "   http://localhost:8080/?canisterId=$REWARDS_ID"
echo ""
print_info "Users can now claim rewards using:"
echo "   dfx canister call rewards claimReward '(variant { UserVerified }, null)'"
echo "   dfx canister call rewards claimReward '(variant { ModulePassed }, opt 1 : nat)'"
echo ""



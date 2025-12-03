#!/bin/bash

# Deploy ICRC Token Ledger
# Purpose: Deploy ICRC1 token ledger(s) for local development
# Usage: 
#   Deploy all tokens (default): ./scripts/deploy_icrc_tokens.sh
#   Deploy single token: ./scripts/deploy_icrc_tokens.sh <TOKEN_SYMBOL>
#   Examples: ./scripts/deploy_icrc_tokens.sh
#             ./scripts/deploy_icrc_tokens.sh ICP

set -e

# Token configurations (from constants.ts)
# Array of token symbols to deploy
TOKEN_SYMBOLS="ICP BOB BDOG"

# Helper function to get token config
get_token_config() {
  local SYMBOL="$1"
  local CONFIG_TYPE="$2"  # NAME, CANISTER_ID, or INITIAL_SUPPLY
  
  case "$SYMBOL" in
    ICP)
      case "$CONFIG_TYPE" in
        NAME)
          echo "Internet Computer"
          ;;
        CANISTER_ID)
          echo "ryjl3-tyaaa-aaaaa-aaaba-cai"
          ;;
        INITIAL_SUPPLY)
          echo "2_000_000_000_000_000"  # 20M tokens with 8 decimals
          ;;
        *)
          echo ""
          ;;
      esac
      ;;
    BOB)
      case "$CONFIG_TYPE" in
        NAME)
          echo "BOB"
          ;;
        CANISTER_ID)
          echo "7pail-xaaaa-aaaas-aabmq-cai"
          ;;
        INITIAL_SUPPLY)
          echo "2_100_000_000_000_000"  # 21M tokens with 8 decimals
          ;;
        *)
          echo ""
          ;;
      esac
      ;;
    BDOG)
      case "$CONFIG_TYPE" in
        NAME)
          echo "BOBDOG"
          ;;
        CANISTER_ID)
          echo "2qqix-tiaaa-aaaam-qeria-cai"
          ;;
        INITIAL_SUPPLY)
          echo "100_000_000_000_000_000"  # 1000M tokens with 8 decimals
          ;;
        *)
          echo ""
          ;;
      esac
      ;;
    *)
      echo ""
      ;;
  esac
}

# Print usage information
usage() {
  echo "Usage:"
  echo "  Deploy all tokens (default): $0"
  echo "  Deploy single token: $0 <TOKEN_SYMBOL>"
  echo ""
  echo "Available tokens:"
  echo "  ICP  - Internet Computer (ryjl3-tyaaa-aaaaa-aaaba-cai)"
  echo "  BOB  - BOB (7pail-xaaaa-aaaas-aabmq-cai)"
  echo "  BDOG - BOBDOG (2qqix-tiaaa-aaaam-qeria-cai)"
  echo ""
  echo "Examples:"
  echo "  $0                    # Deploy all 3 tokens"
  echo "  $0 ICP                # Deploy only ICP"
  exit 1
}

# Function to deploy a single token
deploy_token() {
  local TOKEN_NAME="$1"
  local TOKEN_SYMBOL="$2"
  local CANISTER_ID="$3"
  local INITIAL_BALANCE_OWNER="$4"
  local MINTER="$5"
  local INITIAL_SUPPLY="$6"
  
  echo "🪙 Deploying $TOKEN_NAME token with symbol $TOKEN_SYMBOL..."
  echo "   Initial supply: $INITIAL_SUPPLY atomic units"
  
  dfx deploy "$TOKEN_SYMBOL" --mode reinstall --specified-id "$CANISTER_ID" --argument "
    (variant {
      Init = record {
        token_name = \"${TOKEN_NAME}\";
        token_symbol = \"${TOKEN_SYMBOL}\";
        minting_account = record {
          owner = principal \"${MINTER}\";
        };
        initial_balances = vec {
          record {
            record {
              owner = principal \"${INITIAL_BALANCE_OWNER}\";
            };
            ${INITIAL_SUPPLY};
          };
        };
        metadata = vec {};
        transfer_fee = 10_000;
        archive_options = record {
          trigger_threshold = 2000;
          num_blocks_to_archive = 1000;
          controller_id = principal \"${MINTER}\";
        };
        feature_flags = opt record {
          icrc2 = true;
        };
      }
    })
  "
  
  echo "💰 Checking balance for $INITIAL_BALANCE_OWNER..."
  dfx canister call "$CANISTER_ID" icrc1_balance_of "(record { owner = principal \"$INITIAL_BALANCE_OWNER\"; })"
  
  echo "✅ $TOKEN_NAME token deployed successfully!"
  echo ""
}

# Initialize variables
TOKEN_SYMBOL=""

# Parse arguments (optional single token symbol)
if [[ $# -gt 0 ]]; then
  TOKEN_SYMBOL="$1"
  # Validate token symbol if provided
  if [[ -n "$TOKEN_SYMBOL" ]]; then
    TOKEN_NAME=$(get_token_config "$TOKEN_SYMBOL" "NAME")
    if [[ -z "$TOKEN_NAME" ]]; then
      echo "❌ Error: Unknown token symbol '$TOKEN_SYMBOL'"
      echo ""
      usage
    fi
  fi
fi

# Store the original identity
ORIGINAL_IDENTITY=$(dfx identity whoami)
OWNER=$(dfx identity get-principal)

echo "👤 Original identity: $ORIGINAL_IDENTITY"
echo "🔑 Using current identity principal: $OWNER"
INITIAL_BALANCE_OWNER="$OWNER"

# Create and use minter identity if it doesn't exist
if ! dfx identity list | grep -q "token_minter"; then
    echo "🔑 Creating minter identity..."
    dfx identity new token_minter
fi

echo "🔄 Switching to minter identity..."
dfx identity use token_minter
MINTER=$(dfx identity get-principal)
echo "🔑 Minter principal: $MINTER"
echo ""

# Deploy tokens
if [[ -z "$TOKEN_SYMBOL" ]]; then
  # Deploy all tokens
  echo "🚀 Deploying all 3 tokens (ICP, BOB, BDOG)..."
  echo ""
  
  for SYMBOL in $TOKEN_SYMBOLS; do
    TOKEN_NAME=$(get_token_config "$SYMBOL" "NAME")
    CANISTER_ID=$(get_token_config "$SYMBOL" "CANISTER_ID")
    INITIAL_SUPPLY=$(get_token_config "$SYMBOL" "INITIAL_SUPPLY")
    deploy_token "$TOKEN_NAME" "$SYMBOL" "$CANISTER_ID" "$INITIAL_BALANCE_OWNER" "$MINTER" "$INITIAL_SUPPLY"
  done
  
  echo "🎉 All tokens deployed successfully!"
else
  # Deploy single token
  TOKEN_NAME=$(get_token_config "$TOKEN_SYMBOL" "NAME")
  CANISTER_ID=$(get_token_config "$TOKEN_SYMBOL" "CANISTER_ID")
  INITIAL_SUPPLY=$(get_token_config "$TOKEN_SYMBOL" "INITIAL_SUPPLY")
  
  echo "🪙 Token name: $TOKEN_NAME"
  echo "🔤 Token symbol: $TOKEN_SYMBOL"
  echo "🆔 Canister ID: $CANISTER_ID"
  echo ""
  
  deploy_token "$TOKEN_NAME" "$TOKEN_SYMBOL" "$CANISTER_ID" "$INITIAL_BALANCE_OWNER" "$MINTER" "$INITIAL_SUPPLY"
fi

# Switch back to original identity
dfx identity use "$ORIGINAL_IDENTITY"

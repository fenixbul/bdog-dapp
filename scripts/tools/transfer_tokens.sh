#!/bin/bash

# Transfer ICRC Tokens
# Purpose: Transfer tokens from current identity to a principal for all tokens (ICP, BOB, BDOG)
# Usage: ./scripts/transfer_tokens.sh <TO_PRINCIPAL>

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Token configurations (from constants.ts)
TOKEN_SYMBOLS="ICP BOB BDOG"

# Fixed transfer amount (1000000000 atomic units = 10 tokens with 8 decimals)
TRANSFER_AMOUNT="1000000000"

# Helper function to get token canister ID
get_token_canister_id() {
  local SYMBOL="$1"
  
  case "$SYMBOL" in
    ICP)
      echo "ryjl3-tyaaa-aaaaa-aaaba-cai"
      ;;
    BOB)
      echo "7pail-xaaaa-aaaas-aabmq-cai"
      ;;
    BDOG)
      echo "2qqix-tiaaa-aaaam-qeria-cai"
      ;;
    *)
      echo ""
      ;;
  esac
}

# Print usage information
usage() {
  echo "Usage: $0 <TO_PRINCIPAL>"
  echo ""
  echo "Arguments:"
  echo "  TO_PRINCIPAL   Required - Principal ID to send tokens to"
  echo ""
  echo "This script will transfer $TRANSFER_AMOUNT atomic units (10 tokens) of each:"
  echo "  - ICP  (ryjl3-tyaaa-aaaaa-aaaba-cai)"
  echo "  - BOB  (7pail-xaaaa-aaaas-aabmq-cai)"
  echo "  - BDOG (2qqix-tiaaa-aaaam-qeria-cai)"
  echo ""
  echo "Example:"
  echo "  $0 <principal-id>"
  exit 1
}

# Validate arguments
if [[ $# -lt 1 ]]; then
  echo -e "${RED}❌ Error: Missing required argument${NC}"
  usage
fi

TO_PRINCIPAL="$1"
FROM_PRINCIPAL=$(dfx identity get-principal)

# Validate principal ID format (basic check)
if [[ ! "$TO_PRINCIPAL" =~ ^[a-z0-9-]+$ ]]; then
  echo -e "${RED}❌ Error: Invalid TO_PRINCIPAL format${NC}"
  exit 1
fi

echo -e "${GREEN}🔄 Transferring tokens to $TO_PRINCIPAL...${NC}"
echo "   From: $FROM_PRINCIPAL"
echo "   To: $TO_PRINCIPAL"
echo "   Amount per token: $TRANSFER_AMOUNT atomic units"
echo ""

# Function to transfer tokens for a single token
transfer_token() {
  local SYMBOL="$1"
  local CANISTER_ID="$2"
  
  echo -e "${GREEN}📤 Transferring $SYMBOL...${NC}"
  
  TRANSFER_RESULT=$(dfx canister call "$CANISTER_ID" icrc1_transfer "(record {
    to = record {
      owner = principal \"$TO_PRINCIPAL\";
      subaccount = null;
    };
    amount = $TRANSFER_AMOUNT : nat;
    fee = null;
    memo = opt (vec {});
    from_subaccount = null;
    created_at_time = null;
  })" 2>&1)
  
  if echo "$TRANSFER_RESULT" | grep -q "Ok"; then
    echo -e "${GREEN}✅ $SYMBOL transfer successful!${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}❌ $SYMBOL transfer failed!${NC}"
    echo "$TRANSFER_RESULT"
    echo ""
    return 1
  fi
}

# Transfer tokens for all tokens
SUCCESS_COUNT=0
FAIL_COUNT=0

for SYMBOL in $TOKEN_SYMBOLS; do
  CANISTER_ID=$(get_token_canister_id "$SYMBOL")
  
  if transfer_token "$SYMBOL" "$CANISTER_ID"; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Summary
echo -e "${GREEN}📊 Transfer Summary:${NC}"
echo "   Successful: $SUCCESS_COUNT"
if [[ $FAIL_COUNT -gt 0 ]]; then
  echo -e "${RED}   Failed: $FAIL_COUNT${NC}"
fi
echo ""

# Show balances after transfer
echo -e "${GREEN}💰 Checking balances for $TO_PRINCIPAL...${NC}"
for SYMBOL in $TOKEN_SYMBOLS; do
  CANISTER_ID=$(get_token_canister_id "$SYMBOL")
  echo -n "   $SYMBOL: "
  dfx canister call "$CANISTER_ID" icrc1_balance_of "(record { owner = principal \"$TO_PRINCIPAL\"; })" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "unable to fetch"
done

if [[ $FAIL_COUNT -eq 0 ]]; then
  echo ""
  echo -e "${GREEN}🎉 All transfers completed successfully!${NC}"
  exit 0
else
  echo ""
  echo -e "${YELLOW}⚠ Some transfers failed. Check the output above for details.${NC}"
  exit 1
fi

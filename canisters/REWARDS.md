# Rewards System

Simple rewards system for distributing tokens to users based on achievements.

## What It Does

- Tracks reward eligibility (user verified, module passed)
- Stores claim history
- Transfers tokens to users when they claim rewards
- Manages token registry (similar to treasury)

## Setup

### 1. Deploy the Canister

```bash
dfx deploy rewards
```

### 2. Configure Canister IDs

Set the players and skill_module canister IDs:

```bash
dfx canister call rewards setPlayersCanisterId '(principal "YOUR_PLAYERS_CANISTER_ID")'
dfx canister call rewards setSkillModuleCanisterId '(principal "YOUR_SKILL_MODULE_CANISTER_ID")'
```

### 3. Register Tokens

Register tokens that will be used for rewards:

```bash
dfx canister call rewards registerToken '(principal "TOKEN_CANISTER_ID")'
```

### 4. Set Reward Configurations

Configure reward amounts for each reward type:

```bash
# User verified reward
dfx canister call rewards setRewardConfig '(record {
  rewardType = variant { UserVerified };
  token = principal "TOKEN_CANISTER_ID";
  amount = 50_000_000_000 : nat;  # 50 tokens (8 decimals)
})'

# Module passed reward
dfx canister call rewards setRewardConfig '(record {
  rewardType = variant { ModulePassed };
  token = principal "TOKEN_CANISTER_ID";
  amount = 100_000_000_000 : nat;  # 100 tokens (8 decimals)
})'
```

### 5. Deposit Tokens

Transfer tokens to the rewards canister (via ICRC transfer or from treasury):

```bash
# Transfer tokens directly to rewards canister via ICRC
# Or use treasury to transfer to rewards canister
```

## Usage

### Claim Rewards

Users can claim rewards directly:

```bash
# Claim user verified reward
dfx canister call rewards claimReward '(variant { UserVerified }, null)'

# Claim module passed reward (requires module ID)
dfx canister call rewards claimReward '(variant { ModulePassed }, opt 1 : nat)'
```

### Check Claim Status

```bash
# Check if a reward is claimed
dfx canister call rewards isRewardClaimed '(null, variant { UserVerified }, null)'

# Get claim history
dfx canister call rewards getClaimHistory '(null)'
```

### Query Functions

```bash
# Get all registered tokens
dfx canister call rewards getAllTokens

# Get reward configuration
dfx canister call rewards getRewardConfig '(variant { UserVerified })'

# Get rewards canister balance
dfx canister call rewards getRewardBalance '(principal "TOKEN_CANISTER_ID", null)'
```

## Reward Types

- **UserVerified**: User has verified their X account
- **ModulePassed**: User has passed a specific module/quiz

## Admin Functions

### Manage Authorized Principals

```bash
# Add authorized principal
dfx canister call rewards addAuthorizedPrincipal '(principal "PRINCIPAL_ID")'

# Remove authorized principal
dfx canister call rewards removeAuthorizedPrincipal '(principal "PRINCIPAL_ID")'

# Get authorized principals
dfx canister call rewards getAuthorizedPrincipals
```

## How It Works

1. **User Verified Reward**:
   - System checks players canister for `is_x_verified = true`
   - If verified, transfers configured token amount to user
   - Records claim to prevent double-claiming

2. **Module Passed Reward**:
   - User must provide module ID
   - System verifies module completion (simplified for MVP)
   - Transfers configured token amount to user
   - Records claim with module ID to allow per-module rewards

## Notes

- Each reward type can only be claimed once per user
- Module passed rewards are tracked per module (user can claim for each module)
- Tokens must be deposited to rewards canister before claims can be processed
- All claims are permanently recorded


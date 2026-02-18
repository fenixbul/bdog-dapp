# Rewards Manager

Unified rewards system for distributing tokens to users based on achievements. Uses a flexible verification interface that delegates eligibility checks to external canisters.

## Architecture

The rewards manager uses a **unified verification interface** that allows any canister to verify reward eligibility. This makes it easy to add new reward types without modifying the rewards manager itself.

### Key Features

- **Unified Verification**: All verification canisters implement the same interface
- **O(1) Claim Tracking**: Uses TrieMap for efficient claim lookups
- **Token Management**: Supports multiple ICRC tokens
- **Flexible Configuration**: Each reward type maps to its own verification canister

## Setup

### 1. Deploy the Canister

```bash
dfx deploy rewards_manager
```

### 2. Register Tokens

Register tokens that will be used for rewards:

```bash
dfx canister call rewards_manager registerToken '(principal "TOKEN_CANISTER_ID")'
```

### 3. Set Reward Configurations

Configure reward amounts and verification canisters for each reward type:

```bash
# User verified reward
dfx canister call rewards_manager setRewardConfig '(record {
  rewardType = variant { UserVerified };
  token = principal "TOKEN_CANISTER_ID";
  amount = 50_000_000_000 : nat;  # 50 tokens (8 decimals)
  verificationCanisterId = principal "PLAYERS_CANISTER_ID";
})'

# Module passed reward
dfx canister call rewards_manager setRewardConfig '(record {
  rewardType = variant { ModulePassed };
  token = principal "TOKEN_CANISTER_ID";
  amount = 100_000_000_000 : nat;  # 100 tokens (8 decimals)
  verificationCanisterId = principal "SKILL_MODULE_CANISTER_ID";
})'
```

### 4. Deposit Tokens

Transfer tokens to the rewards manager canister (via ICRC transfer):

```bash
dfx canister call TOKEN_CANISTER_ID icrc1_transfer '(record {
  to = record { owner = principal "REWARDS_MANAGER_CANISTER_ID"; subaccount = null; };
  amount = 1_000_000_000_000 : nat;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})'
```

## Usage

### Claim Rewards

Users can claim rewards directly (no moduleId needed):

```bash
# Claim user verified reward
dfx canister call rewards_manager claimReward '(variant { UserVerified })'

# Claim module passed reward
dfx canister call rewards_manager claimReward '(variant { ModulePassed })'
```

### Check Claim Status

```bash
# Check if a reward is claimed
dfx canister call rewards_manager isRewardClaimed '(null, variant { UserVerified })'

# Get claim history
dfx canister call rewards_manager getClaimHistory '(null)'
```

### Query Functions

```bash
# Get all registered tokens
dfx canister call rewards_manager getAllTokens

# Get reward configuration
dfx canister call rewards_manager getRewardConfig '(variant { UserVerified })'

# Get rewards canister balance
dfx canister call rewards_manager getRewardBalance '(principal "TOKEN_CANISTER_ID", null)'
```

## Reward Types

- **UserVerified**: User has verified their X account (verified by players canister)
- **ModulePassed**: User has passed a module/quiz (verified by skill_module canister)

## Verification Interface

All verification canisters must implement:

```motoko
public type VerificationActor = actor {
  checkRewardEligibility : shared query (EligibilityRequest) -> async Result.Result<EligibilityResponse, Text>;
};
```

Where:
- `EligibilityRequest` = `{ userId : Principal; rewardType : Text; }`
- `EligibilityResponse` = `{ eligible : Bool; reason : ?Text; }`

## Admin Functions

### Manage Authorized Principals

```bash
# Add authorized principal
dfx canister call rewards_manager addAuthorizedPrincipal '(principal "PRINCIPAL_ID")'

# Remove authorized principal
dfx canister call rewards_manager removeAuthorizedPrincipal '(principal "PRINCIPAL_ID")'

# Get authorized principals
dfx canister call rewards_manager getAuthorizedPrincipals
```

## How It Works

1. **User Claims Reward**: Calls `claimReward(rewardType)`
2. **Check Already Claimed**: O(1) lookup in TrieMap using `(userId, rewardType)` key
3. **Get Configuration**: Retrieves reward config with `verificationCanisterId`
4. **Verify Eligibility**: Calls verification canister's `checkRewardEligibility` method
5. **Transfer Tokens**: If eligible, transfers configured amount via ICRC
6. **Record Claim**: Stores claim in both TrieMap (for fast lookup) and Buffer (for history)

## Notes

- Each reward type can only be claimed once per user (tracked by `(userId, rewardType)` pair)
- Verification logic is externalized - each reward type can use a different verification canister
- Tokens must be deposited to rewards manager canister before claims can be processed
- All claims are permanently recorded for history tracking





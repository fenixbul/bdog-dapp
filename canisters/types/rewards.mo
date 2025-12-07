import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";

module {
  //============================================================================
  // TYPES & DATA MODELS
  //============================================================================

  /// Reward types supported by the rewards system
  public type RewardType = {
    #UserVerified;
    #ModulePassed;
  };

  /// Reward status (for tracking)
  public type RewardStatus = {
    #Available;
    #Claimed;
  };

  /// Reward claim record
  public type RewardClaim = {
    id : Nat;
    userId : Principal;
    rewardType : RewardType;
    moduleId : ?Nat; // Optional, only for #ModulePassed
    token : Principal; // Token canister ID
    amount : Nat;
    claimedAt : Time.Time;
    transactionId : ?Nat; // Optional, ICRC transfer block index
  };

  /// Reward configuration for fixed amounts
  public type RewardConfig = {
    rewardType : RewardType;
    token : Principal; // Token canister ID
    amount : Nat; // Fixed reward amount
  };

  /// Error types for rewards operations
  public type RewardError = {
    #Unauthorized;
    #RewardNotAvailable;
    #AlreadyClaimed;
    #TokenNotRegistered;
    #InsufficientBalance;
    #InvalidAmount;
    #TransferError : ICRCTransferError;
    #ConditionNotMet : Text; // Reason why condition not met
    #GetBalanceError : Text;
  };

  // ICRC TransferError type definition (matches ICRC.TransferError structure)
  public type ICRCTransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #TemporarilyUnavailable;
    #Duplicate : { duplicate_of : Nat };
    #GenericError : { error_code : Nat; message : Text };
  };
};


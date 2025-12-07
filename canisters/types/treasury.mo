import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

module {
  //============================================================================
  // TYPES & DATA MODELS
  //============================================================================

  /// Transaction types supported by the treasury
  public type TransactionType = {
    #Deposit;
    #Transfer;
  };

  /// Treasury operational status
  public type TreasuryStatus = {
    #Active;
    #Frozen;
  };

  /// Transaction log entry with all required fields
  public type TransactionLog = {
    id : Nat;
    timestamp : Time.Time;
    transactionType : TransactionType;
    amount : Nat;
    token : Principal; // Token canister ID
    initiator : Principal; // Who initiated the transaction
    description : ?Text;
    blockHeight : ?Nat; // For blockchain tracking
  };

  /// Error types for treasury operations
  // Note: TransferError uses ICRC.TransferError from ICRC module
  public type TreasuryError = {
    #Unauthorized;
    #TreasuryFrozen;
    #TokenNotRegistered;
    #InsufficientBalance;
    #InvalidAmount;
    #NotFound;
    #TransferError : ICRCTransferError;
    #GetBalanceError : Text;
  };

  // ICRC TransferError type definition (matches ICRC.TransferError structure)
  // This is defined here to avoid circular dependencies
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

  //============================================================================
  // UTILITY FUNCTIONS
  //============================================================================

  public func transaction_key(t : Nat) : Trie.Key<Nat> = {
    key = t;
    hash = Int.hash(t);
  };

  public func transactions_fromArray(arr : [TransactionLog]) : Trie.Trie<Nat, TransactionLog> {
    var s = Trie.empty<Nat, TransactionLog>();
    for (transaction in arr.vals()) {
      s := Trie.put(s, transaction_key(transaction.id), Nat.equal, transaction).0;
    };
    s;
  };
};


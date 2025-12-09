import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Trie "mo:base/Trie";
import Error "mo:base/Error";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Types "types/treasury";
import ICRC "ICRC";
import accessControl "modules/accessControl";

/// Rewards Treasury canister for managing rewards tokens
/// Provides secure storage and management of treasury assets and transaction logs
shared ({ caller = initializer }) persistent actor class RewardsTreasury() = this {
  //============================================================================
  // STABLE STORAGE LAYER
  //============================================================================
  stable var transactionLogsStorage : [Types.TransactionLog] = [];
  stable var tokenRegistryStorage : [(Principal, Principal)] = [];
  stable var authorizedPrincipalsStorage : [Principal] = [];
  stable var treasuryStatus : Types.TreasuryStatus = #Active;
  stable var nextTransactionId : Nat = 1;

  //============================================================================
  // TRANSIENT WORKING DATA
  //============================================================================
  private transient var transactionLogs = Trie.empty<Nat, Types.TransactionLog>();
  private transient var tokenRegistry = Map.new<Principal, Principal>();
  private transient var authorizedPrincipals = Map.new<Principal, ()>();

  //============================================================================
  // INITIALIZATION
  //============================================================================
  // Initialize authorized principals with initializer
  Map.set(authorizedPrincipals, phash, initializer, ());

  //============================================================================
  // PREUPGRADE & POSTUPGRADE
  //============================================================================
  system func preupgrade() {
    // Convert Trie to array for transaction logs
    // We need to extract all values from the Trie
    var logsBuffer = Buffer.Buffer<Types.TransactionLog>(Trie.size(transactionLogs));
    // Iterate through all possible keys (0 to nextTransactionId-1)
    var id : Nat = 0;
    while (id < nextTransactionId) {
      switch (Trie.get(transactionLogs, Types.transaction_key(id), Nat.equal)) {
        case (?log) {
          logsBuffer.add(log);
        };
        case (null) {};
      };
      id += 1;
    };
    transactionLogsStorage := Buffer.toArray(logsBuffer);

    // Convert Map to array for token registry
    tokenRegistryStorage := Iter.toArray(Map.entries(tokenRegistry));

    // Convert Map to array for authorized principals
    authorizedPrincipalsStorage := Iter.toArray(Map.keys(authorizedPrincipals));
  };

  system func postupgrade() {
    // Restore transaction logs from stable storage
    transactionLogs := Types.transactions_fromArray(transactionLogsStorage);

    // Restore token registry from stable storage
    tokenRegistry := Map.new<Principal, Principal>();
    for ((tokenId, canisterId) in tokenRegistryStorage.vals()) {
      Map.set(tokenRegistry, phash, tokenId, canisterId);
    };

    // Restore authorized principals from stable storage
    authorizedPrincipals := Map.new<Principal, ()>();
    for (principal in authorizedPrincipalsStorage.vals()) {
      Map.set(authorizedPrincipals, phash, principal, ());
    };
    // Ensure initializer is always authorized (in case of fresh install)
    if (not Map.has(authorizedPrincipals, phash, initializer)) {
      Map.set(authorizedPrincipals, phash, initializer, ());
    };
  };

  //============================================================================
  // ACCESS CONTROL FUNCTIONS
  //============================================================================
  // Add authorized principal
  public shared (msg) func addAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to add authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to add authorized principals");
    };

    // Add the principal
    Map.set(authorizedPrincipals, phash, pid, ());
    return #ok(());
  };

  // Remove authorized principal
  public shared (msg) func removeAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    // Check if the caller has permission to remove authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to remove authorized principals");
    };

    // Remove the principal
    Map.delete(authorizedPrincipals, phash, pid);
    return #ok(());
  };

  // Get authorized principals
  public shared (msg) func getAuthorizedPrincipals() : async Result.Result<[Principal], Text> {
    // Check if the caller has permission to get authorized principals
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get authorized principals");
    };

    // Get authorized principals
    return #ok(Iter.toArray(Map.keys(authorizedPrincipals)));
  };

  //============================================================================
  // TREASURY STATUS MANAGEMENT
  //============================================================================
  /// Get current treasury status
  public query func getTreasuryStatus() : async Types.TreasuryStatus {
    treasuryStatus;
  };

  /// Set treasury status (authorized only)
  public shared (msg) func setTreasuryStatus(status : Types.TreasuryStatus) : async Result.Result<(), Types.TreasuryError> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err(#Unauthorized);
    };

    treasuryStatus := status;

    #ok(());
  };

  //============================================================================
  // TOKEN REGISTRY MANAGEMENT
  //============================================================================
  /// Register a new token in the treasury
  public shared (msg) func registerToken(canisterId : Principal) : async Result.Result<(), Types.TreasuryError> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err(#Unauthorized);
    };

    if (treasuryStatus != #Active) {
      return #err(#TreasuryFrozen);
    };

    Map.set(tokenRegistry, phash, canisterId, canisterId);

    Debug.print("Token registered: " # Principal.toText(canisterId));
    #ok(());
  };

  /// Get all registered tokens
  public query func getAllTokens() : async [(Principal, Principal)] {
    Iter.toArray(Map.entries(tokenRegistry));
  };

  //============================================================================
  // TRANSACTION LOG MANAGEMENT
  //============================================================================
  /// Get transaction by ID
  public query func getTransaction(id : Nat) : async ?Types.TransactionLog {
    Trie.get(transactionLogs, Types.transaction_key(id), Nat.equal);
  };

  /// Get total number of transactions
  public query func getTransactionCount() : async Nat {
    Trie.size(transactionLogs);
  };

  /// Add a transaction to the log (internal function)
  private func addTransactionLog(
    transactionType : Types.TransactionType,
    amount : Nat,
    token : Principal,
    initiator : Principal,
    description : ?Text,
    blockHeight : ?Nat
  ) : Nat {
    let logEntry : Types.TransactionLog = {
      id = nextTransactionId;
      timestamp = Time.now();
      transactionType = transactionType;
      amount = amount;
      token = token;
      initiator = initiator;
      description = description;
      blockHeight = blockHeight;
    };

    transactionLogs := Trie.put(transactionLogs, Types.transaction_key(nextTransactionId), Nat.equal, logEntry).0;
    let currentId = nextTransactionId;
    nextTransactionId += 1;

    currentId;
  };

  //============================================================================
  // TRANSFER OPERATIONS
  //============================================================================
  /// Transfer tokens from the treasury
  public shared (msg) func transfer(
    token : Principal,
    amount : Nat,
    recipient : Principal,
    toSubaccount : ?Blob,
    fromSubaccount : ?Blob
  ) : async Result.Result<Nat, Types.TreasuryError> {
    // Only authorized principals can transfer
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err(#Unauthorized);
    };

    // Validate amount is greater than 0
    if (amount == 0) {
      return #err(#InvalidAmount);
    };

    // Check treasury is active
    if (treasuryStatus != #Active) {
      return #err(#TreasuryFrozen);
    };

    // Check token is registered
    switch (Map.get(tokenRegistry, phash, token)) {
      case (null) { return #err(#TokenNotRegistered) };
      case (?_) { /* Token is registered, proceed */ };
    };

    // Create ICRC actor instance
    let tokenActor : ICRC.Actor = actor (Principal.toText(token));

    // Check treasury balance for this token
    let treasuryAccount : ICRC.Account = {
      owner = Principal.fromActor(this);
      subaccount = fromSubaccount;
    };

    let treasuryBalance = await tokenActor.icrc1_balance_of(treasuryAccount);
    if (treasuryBalance < amount) {
      return #err(#InsufficientBalance);
    };

    // Get the fee from the token
    let fee = await tokenActor.icrc1_fee();

    // Perform the ICRC transfer
    let transferArgs : ICRC.TransferArg = {
      from_subaccount = fromSubaccount;
      to = {
        owner = recipient;
        subaccount = toSubaccount;
      };
      amount = amount;
      fee = ?fee;
      memo = null;
      created_at_time = null;
    };

    let transferResult = await tokenActor.icrc1_transfer(transferArgs);

    // Handle transfer result
    let blockHeight = switch (transferResult) {
      case (#Ok(height)) { ?height };
      case (#Err(err)) {
        // Convert ICRC.TransferError to Types.ICRCTransferError
        let convertedError : Types.ICRCTransferError = switch (err) {
          case (#BadFee(e)) { #BadFee({ expected_fee = e.expected_fee }) };
          case (#BadBurn(e)) { #BadBurn({ min_burn_amount = e.min_burn_amount }) };
          case (#InsufficientFunds(e)) { #InsufficientFunds({ balance = e.balance }) };
          case (#TooOld) { #TooOld };
          case (#CreatedInFuture(e)) { #CreatedInFuture({ ledger_time = e.ledger_time }) };
          case (#TemporarilyUnavailable) { #TemporarilyUnavailable };
          case (#Duplicate(e)) { #Duplicate({ duplicate_of = e.duplicate_of }) };
          case (#GenericError(e)) { #GenericError({ error_code = e.error_code; message = e.message }) };
        };
        return #err(#TransferError(convertedError));
      };
    };

    // Log the transaction
    let description = "Transfer from treasury to " # Principal.toText(recipient);
    let transactionId = addTransactionLog(
      #Transfer,
      amount,
      token,
      msg.caller,
      ?description,
      blockHeight
    );

    Debug.print("Transfer completed - Transaction ID: " # Nat.toText(transactionId));
    #ok(transactionId);
  };

  //============================================================================
  // TREASURY BALANCE QUERIES
  //============================================================================
  /// Get treasury balance for a specific token
  public func getTreasuryBalance(token : Principal, treasurySubaccount : ?Blob) : async Result.Result<Nat, Types.TreasuryError> {
    // Check token is registered
    switch (Map.get(tokenRegistry, phash, token)) {
      case (null) { return #err(#TokenNotRegistered) };
      case (?_) { /* Token is registered, proceed */ };
    };
    // Create ICRC actor instance
    let tokenActor : ICRC.Actor = actor (Principal.toText(token));

    // Get treasury balance
    let treasuryAccount : ICRC.Account = {
      owner = Principal.fromActor(this);
      subaccount = treasurySubaccount;
    };

    try {
      let balance = await tokenActor.icrc1_balance_of(treasuryAccount);
      #ok(balance);
    } catch (err) {
      #err(#GetBalanceError("Failed to get balance: " # Error.message(err)));
    };
  };
};


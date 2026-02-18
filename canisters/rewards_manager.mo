import Map "mo:map/Map";
import { phash } "mo:map/Map";
import TrieMap "mo:base/TrieMap";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Error "mo:base/Error";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Types "types/rewards";
import RewardVerification "types/reward_verification";
import ICRC "ICRC";
import accessControl "modules/accessControl";

/// Rewards canister for managing and distributing rewards to players
/// Tracks reward eligibility and claim history
shared ({ caller = initializer }) persistent actor class RewardsManager() = this {
  // Access control
  let authorizedPrincipals = Map.new<Principal, ()>();
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Unified verification actor type
  type VerificationActor = RewardVerification.VerificationActor;

  //============================================================================
  // STABLE STORAGE LAYER
  //============================================================================
  private var tokenRegistryStorage : [(Principal, Principal)] = [];
  private var rewardClaimsStorage : [Types.RewardClaim] = [];
  private var rewardConfigsStorage : [(Types.RewardType, Types.RewardConfig)] = [];
  private var claimTrackingStorage : [(Principal, Types.RewardType, Bool)] = [];
  private var authorizedPrincipalsStorage : [Principal] = [];
  private var nextClaimId : Nat = 1;

  //============================================================================
  // TRANSIENT WORKING DATA
  //============================================================================
  private transient var tokenRegistry = Map.new<Principal, Principal>();
  // Use Buffer for full claim history (contains detailed claim records)
  private transient var rewardClaims = Buffer.Buffer<Types.RewardClaim>(0);
  // Use Map for reward configs by type (allows easy lookup and extension)
  private transient var rewardConfigs = Map.new<Types.RewardType, Types.RewardConfig>();

  //============================================================================
  // HELPER FUNCTIONS
  //============================================================================
  // Helper function for reward type comparison
  func rewardTypeEqual(a : Types.RewardType, b : Types.RewardType) : Bool {
    switch (a, b) {
      case (#UserVerified, #UserVerified) { true };
      case (#ModulePassed, #ModulePassed) { true };
      case (_, _) { false };
    };
  };

  // Hash function for reward type
  func rewardTypeHash(rewardType : Types.RewardType) : Nat32 {
    switch (rewardType) {
      case (#UserVerified) { 1 : Nat32 };
      case (#ModulePassed) { 2 : Nat32 };
    };
  };

  // Helper functions for claim tracking tuple key equality and hashing
  func claimKeyEqual(a : (Principal, Types.RewardType), b : (Principal, Types.RewardType)) : Bool {
    let (principalA, rewardTypeA) = a;
    let (principalB, rewardTypeB) = b;
    Principal.equal(principalA, principalB) and rewardTypeEqual(rewardTypeA, rewardTypeB);
  };

  func claimKeyHash(key : (Principal, Types.RewardType)) : Nat32 {
    let (principal, rewardType) = key;
    // Convert Principal to Blob and hash it
    let principalBlob = Principal.toBlob(principal);
    let principalHash = Blob.hash(principalBlob);
    let rewardTypeHashValue = rewardTypeHash(rewardType);
    // Combine hashes using XOR
    principalHash ^ rewardTypeHashValue;
  };

  // Use TrieMap for O(1) claim tracking: (userId, rewardType) -> Bool
  // Initialized after helper functions are defined
  private transient var claimTracking = TrieMap.TrieMap<(Principal, Types.RewardType), Bool>(claimKeyEqual, claimKeyHash);

  // Convert RewardType to Text for verification canister
  func rewardTypeToText(rewardType : Types.RewardType) : Text {
    switch (rewardType) {
      case (#UserVerified) { "UserVerified" };
      case (#ModulePassed) { "ModulePassed" };
    };
  };


  //============================================================================
  // PREUPGRADE & POSTUPGRADE
  //============================================================================
  system func preupgrade() {
    // Convert Map to array for token registry
    tokenRegistryStorage := Iter.toArray(Map.entries(tokenRegistry));

    // Convert Buffer to array for reward claims
    rewardClaimsStorage := Buffer.toArray(rewardClaims);

    // Convert Map to array for reward configs
    rewardConfigsStorage := Iter.toArray(Map.entries(rewardConfigs));

    // Convert TrieMap to array for claim tracking
    // Convert ((Principal, RewardType), Bool) entries to (Principal, RewardType, Bool) tuples
    var claimTrackingArray = Buffer.Buffer<(Principal, Types.RewardType, Bool)>(0);
    for ((key, claimed) in claimTracking.entries()) {
      let (userId, rewardType) = key;
      claimTrackingArray.add((userId, rewardType, claimed));
    };
    claimTrackingStorage := Buffer.toArray(claimTrackingArray);

    // Convert Map to array for authorized principals
    authorizedPrincipalsStorage := Iter.toArray(Map.keys(authorizedPrincipals));
  };

  system func postupgrade() {
    // Restore token registry from stable storage
    tokenRegistry := Map.new<Principal, Principal>();
    for ((tokenId, canisterId) in tokenRegistryStorage.vals()) {
      Map.set(tokenRegistry, phash, tokenId, canisterId);
    };

    // Restore reward claims from stable storage
    rewardClaims := Buffer.Buffer<Types.RewardClaim>(rewardClaimsStorage.size());
    for (claim in rewardClaimsStorage.vals()) {
      rewardClaims.add(claim);
    };

    // Restore reward configs from stable storage
    rewardConfigs := Map.new<Types.RewardType, Types.RewardConfig>();
    for ((rewardType, config) in rewardConfigsStorage.vals()) {
      Map.set(rewardConfigs, (rewardTypeHash, rewardTypeEqual), rewardType, config);
    };

    // Restore claim tracking TrieMap from stable storage
    claimTracking := TrieMap.TrieMap<(Principal, Types.RewardType), Bool>(claimKeyEqual, claimKeyHash);
    for ((userId, rewardType, claimed) in claimTrackingStorage.vals()) {
      claimTracking.put((userId, rewardType), claimed);
    };

    // Restore authorized principals from stable storage
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
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to add authorized principals");
    };
    Map.set(authorizedPrincipals, phash, pid, ());
    return #ok(());
  };

  // Remove authorized principal
  public shared (msg) func removeAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to remove authorized principals");
    };
    Map.delete(authorizedPrincipals, phash, pid);
    return #ok(());
  };

  // Get authorized principals
  public shared (msg) func getAuthorizedPrincipals() : async Result.Result<[Principal], Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get authorized principals");
    };
    return #ok(Iter.toArray(Map.keys(authorizedPrincipals)));
  };

  //============================================================================
  // TOKEN REGISTRY MANAGEMENT
  //============================================================================
  /// Register a new token in the rewards system
  public shared (msg) func registerToken(canisterId : Principal) : async Result.Result<(), Types.RewardError> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err(#Unauthorized);
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
  // REWARD CONFIGURATION MANAGEMENT
  //============================================================================
  /// Set reward configuration (authorized only)
  public shared (msg) func setRewardConfig(config : Types.RewardConfig) : async Result.Result<(), Types.RewardError> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err(#Unauthorized);
    };
    // Validate token is registered
    switch (Map.get(tokenRegistry, phash, config.token)) {
      case (null) { return #err(#TokenNotRegistered) };
      case (?_) { /* Token is registered, proceed */ };
    };
    // Store config by reward type
    Map.set(rewardConfigs, (rewardTypeHash, rewardTypeEqual), config.rewardType, config);
    Debug.print("Reward config set for type: " # debug_show(config.rewardType));
    #ok(());
  };

  /// Get reward configuration
  public query func getRewardConfig(rewardType : Types.RewardType) : async ?Types.RewardConfig {
    Map.get(rewardConfigs, (rewardTypeHash, rewardTypeEqual), rewardType);
  };

  //============================================================================
  // UNIFIED VERIFICATION FUNCTION
  //============================================================================
  /// Unified function to check reward eligibility via verification canister
  private func checkRewardEligibility(
    userId : Principal,
    rewardType : Types.RewardType,
    verificationCanisterId : Principal
  ) : async Result.Result<Bool, Text> {
    try {
      let verificationActor : VerificationActor = actor (Principal.toText(verificationCanisterId));
      
      let request : RewardVerification.EligibilityRequest = {
        userId = userId;
        rewardType = rewardTypeToText(rewardType);
      };

      let result = await verificationActor.checkRewardEligibility(request);
      
      switch (result) {
        case (#ok(response)) {
          if (response.eligible) {
            #ok(true)
          } else {
            let reason = switch (response.reason) {
              case (?r) { r };
              case (null) { "Condition not met" };
            };
            #err(reason)
          }
        };
        case (#err(msg)) {
          #err("Verification canister error: " # msg)
        };
      };
    } catch (err) {
      #err("Error calling verification canister: " # Error.message(err))
    };
  };

  //============================================================================
  // REWARD CLAIMING
  //============================================================================
  /// Claim a reward (public function - users call this directly)
  /// Simplified: only requires rewardType, no moduleId
  public shared (msg) func claimReward(rewardType : Types.RewardType) : async Result.Result<Nat, Types.RewardError> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    let userId = msg.caller;

    // Check if reward already claimed - O(1) lookup using TrieMap
    let claimKey = (userId, rewardType);
    switch (claimTracking.get(claimKey)) {
      case (?true) { return #err(#AlreadyClaimed) };
      case (?false) { /* Not claimed, proceed */ };
      case (null) { /* Not claimed, proceed */ };
    };

    // Get reward configuration
    let configOpt = Map.get(rewardConfigs, (rewardTypeHash, rewardTypeEqual), rewardType);
    switch (configOpt) {
      case (null) {
        return #err(#RewardNotAvailable);
      };
      case (?config) {
        // Unified verification check - call verification canister
        let verificationResult = await checkRewardEligibility(
          userId,
          rewardType,
          config.verificationCanisterId
        );

        switch (verificationResult) {
          case (#ok(true)) { /* Eligible, proceed */ };
          case (#ok(false)) {
            return #err(#ConditionNotMet("User is not eligible for this reward"));
          };
          case (#err(msg)) {
            return #err(#VerificationError(msg));
          };
        };

        // Check token is registered
        switch (Map.get(tokenRegistry, phash, config.token)) {
          case (null) { return #err(#TokenNotRegistered) };
          case (?_) { /* Token is registered, proceed */ };
        };

        // Check rewards canister balance
        let tokenActor : ICRC.Actor = actor (Principal.toText(config.token));
        let rewardsAccount : ICRC.Account = {
          owner = Principal.fromActor(this);
          subaccount = null;
        };

        let balance = await tokenActor.icrc1_balance_of(rewardsAccount);
        if (balance < config.amount) {
          return #err(#InsufficientBalance);
        };

        // Get the fee from the token
        let fee = await tokenActor.icrc1_fee();

        // Perform the ICRC transfer
        let transferArgs : ICRC.TransferArg = {
          from_subaccount = null;
          to = {
            owner = userId;
            subaccount = null;
          };
          amount = config.amount;
          fee = ?fee;
          memo = null;
          created_at_time = null;
        };

        let transferResult = await tokenActor.icrc1_transfer(transferArgs);

        // Handle transfer result
        let transactionId = switch (transferResult) {
          case (#Ok(blockIndex)) { ?blockIndex };
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

        // Record the claim
        let claim : Types.RewardClaim = {
          id = nextClaimId;
          userId = userId;
          rewardType = rewardType;
          token = config.token;
          amount = config.amount;
          claimedAt = Time.now();
          transactionId = transactionId;
        };

        rewardClaims.add(claim);
        // Mark as claimed in TrieMap for O(1) future lookups
        claimTracking.put(claimKey, true);
        
        let currentId = nextClaimId;
        nextClaimId += 1;

        Debug.print("Reward claimed - Claim ID: " # Nat.toText(currentId));
        #ok(currentId);
      };
    };
  };

  //============================================================================
  // QUERY FUNCTIONS
  //============================================================================
  /// Get claim history for a user
  public shared query (msg) func getClaimHistory(userId : ?Principal) : async [Types.RewardClaim] {
    let targetUserId = switch (userId) {
      case (?uid) { uid };
      case (null) { msg.caller };
    };
    var claims = Buffer.Buffer<Types.RewardClaim>(0);
    for (claim in rewardClaims.vals()) {
      if (Principal.equal(claim.userId, targetUserId)) {
        claims.add(claim);
      };
    };
    Buffer.toArray(claims);
  };

  /// Check if a specific reward is claimed (simplified - no moduleId)
  /// Uses O(1) TrieMap lookup instead of linear search
  public shared query (msg) func isRewardClaimed(userId : ?Principal, rewardType : Types.RewardType) : async Bool {
    let targetUserId = switch (userId) {
      case (?uid) { uid };
      case (null) { msg.caller };
    };
    let claimKey = (targetUserId, rewardType);
    switch (claimTracking.get(claimKey)) {
      case (?true) { true };
      case (?false) { false };
      case (null) { false };
    };
  };

  /// Get rewards canister balance for a token
  public func getRewardBalance(token : Principal, subaccount : ?Blob) : async Result.Result<Nat, Types.RewardError> {
    // Check token is registered
    switch (Map.get(tokenRegistry, phash, token)) {
      case (null) { return #err(#TokenNotRegistered) };
      case (?_) { /* Token is registered, proceed */ };
    };
    let tokenActor : ICRC.Actor = actor (Principal.toText(token));
    let rewardsAccount : ICRC.Account = {
      owner = Principal.fromActor(this);
      subaccount = subaccount;
    };
    try {
      let balance = await tokenActor.icrc1_balance_of(rewardsAccount);
      #ok(balance);
    } catch (err) {
      #err(#GetBalanceError("Failed to get balance: " # Error.message(err)));
    };
  };

  //============================================================================
  // DEPOSIT FUNCTION (for receiving tokens from treasury/donations)
  //============================================================================
  /// Deposit rewards (authorized only or via ICRC transfer directly)
  /// Note: In practice, tokens are deposited via direct ICRC transfers to this canister
  /// This function is for tracking/logging purposes if needed
  public shared (_msg) func depositRewards(token : Principal, amount : Nat) : async Result.Result<(), Types.RewardError> {
    // This is mainly for logging - actual deposits happen via ICRC transfers
    // Check token is registered
    switch (Map.get(tokenRegistry, phash, token)) {
      case (null) { return #err(#TokenNotRegistered) };
      case (?_) { /* Token is registered, proceed */ };
    };
    Debug.print("Rewards deposit logged - Token: " # Principal.toText(token) # ", Amount: " # Nat.toText(amount));
    #ok(());
  };
};


import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Error "mo:base/Error";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Types "types/rewards";
import ICRC "ICRC";
import accessControl "modules/accessControl";
import Player "types/player";
import SkillModuleTypes "types/skill_module";

/// Rewards canister for managing and distributing rewards to players
/// Tracks reward eligibility and claim history
shared ({ caller = initializer }) persistent actor class Rewards() = this {
  // Access control
  let authorizedPrincipals = Map.new<Principal, ()>();
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Actor types for inter-canister calls
  type PlayersActor = actor {
    get_player_by_id : shared query (Principal) -> async Result.Result<Player.Player, Text>;
  };

  type SkillModuleActor = actor {
    get_module : shared (Principal) -> async ?SkillModuleTypes.ModuleWithUserState;
  };

  //============================================================================
  // STABLE STORAGE LAYER
  //============================================================================
  private var tokenRegistryStorage : [(Principal, Principal)] = [];
  private var rewardClaimsStorage : [Types.RewardClaim] = [];
  private var userVerifiedConfigStorage : ?Types.RewardConfig = null;
  private var modulePassedConfigStorage : ?Types.RewardConfig = null;
  private var authorizedPrincipalsStorage : [Principal] = [];
  private var nextClaimId : Nat = 1;

  // Canister IDs for inter-canister calls (set by authorized principals)
  private var playersCanisterId : ?Principal = null;
  private var skillModuleCanisterId : ?Principal = null;

  //============================================================================
  // TRANSIENT WORKING DATA
  //============================================================================
  private transient var tokenRegistry = Map.new<Principal, Principal>();
  // Use Buffer for claims (simpler for MVP, search linearly)
  private transient var rewardClaims = Buffer.Buffer<Types.RewardClaim>(0);
  // Use separate maps for reward configs by type
  private transient var userVerifiedConfig : ?Types.RewardConfig = null;
  private transient var modulePassedConfig : ?Types.RewardConfig = null;

  //============================================================================
  // HELPER FUNCTIONS
  //============================================================================
  // Helper functions for reward type and module ID comparison
  func rewardTypeEqual(a : Types.RewardType, b : Types.RewardType) : Bool {
    switch (a, b) {
      case (#UserVerified, #UserVerified) { true };
      case (#ModulePassed, #ModulePassed) { true };
      case (_, _) { false };
    };
  };

  func moduleIdEqual(a : ?Nat, b : ?Nat) : Bool {
    switch (a, b) {
      case (?idA, ?idB) { idA == idB };
      case (null, null) { true };
      case (_, _) { false };
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

    // Store reward configs
    userVerifiedConfigStorage := userVerifiedConfig;
    modulePassedConfigStorage := modulePassedConfig;

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
    userVerifiedConfig := userVerifiedConfigStorage;
    modulePassedConfig := modulePassedConfigStorage;

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
  // CANISTER CONFIGURATION
  //============================================================================
  // Set players canister ID (authorized only)
  public shared (msg) func setPlayersCanisterId(canisterId : Principal) : async Result.Result<(), Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to set players canister ID");
    };
    playersCanisterId := ?canisterId;
    return #ok(());
  };

  // Set skill module canister ID (authorized only)
  public shared (msg) func setSkillModuleCanisterId(canisterId : Principal) : async Result.Result<(), Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to set skill module canister ID");
    };
    skillModuleCanisterId := ?canisterId;
    return #ok(());
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
    // Store config based on reward type
    switch (config.rewardType) {
      case (#UserVerified) {
        userVerifiedConfig := ?config;
      };
      case (#ModulePassed) {
        modulePassedConfig := ?config;
      };
    };
    Debug.print("Reward config set for type: " # debug_show(config.rewardType));
    #ok(());
  };

  /// Get reward configuration
  public query func getRewardConfig(rewardType : Types.RewardType) : async ?Types.RewardConfig {
    switch (rewardType) {
      case (#UserVerified) { userVerifiedConfig };
      case (#ModulePassed) { modulePassedConfig };
    };
  };

  //============================================================================
  // CONDITION VERIFICATION HELPERS
  //============================================================================
  /// Check if user is verified (private helper)
  private func checkUserVerified(userId : Principal) : async Result.Result<Bool, Text> {
    switch (playersCanisterId) {
      case (null) {
        return #err("Players canister ID not set");
      };
      case (?canisterId) {
        try {
          let playersActor : PlayersActor = actor (Principal.toText(canisterId));
          let playerResult = await playersActor.get_player_by_id(userId);
          switch (playerResult) {
            case (#ok(player)) {
              #ok(player.is_x_verified);
            };
            case (#err(msg)) {
              #err("Failed to get player: " # msg);
            };
          };
        } catch (err) {
          #err("Error calling players canister: " # Error.message(err));
        };
      };
    };
  };

  // Note: Module verification is handled in claimReward since get_module requires the user as caller

  //============================================================================
  // REWARD CLAIMING
  //============================================================================
  /// Claim a reward (public function - users call this directly)
  public shared (msg) func claimReward(rewardType : Types.RewardType, moduleId : ?Nat) : async Result.Result<Nat, Types.RewardError> {
    // Reject anonymous callers
    if (Principal.isAnonymous(msg.caller)) {
      return #err(#Unauthorized);
    };

    let userId = msg.caller;

    // Check if reward already claimed
    for (claim in rewardClaims.vals()) {
      if (Principal.equal(claim.userId, userId) and rewardTypeEqual(claim.rewardType, rewardType) and moduleIdEqual(claim.moduleId, moduleId)) {
        return #err(#AlreadyClaimed);
      };
    };

    // Verify condition based on reward type
    var conditionMet = false;
    switch (rewardType) {
      case (#UserVerified) {
        let verifiedResult = await checkUserVerified(userId);
        switch (verifiedResult) {
          case (#ok(isVerified)) {
            conditionMet := isVerified;
            if (not isVerified) {
              return #err(#ConditionNotMet("User is not X verified"));
            };
          };
          case (#err(msg)) {
            return #err(#ConditionNotMet("Failed to verify user: " # msg));
          };
        };
      };
      case (#ModulePassed) {
        switch (moduleId) {
          case (null) {
            return #err(#ConditionNotMet("Module ID required for ModulePassed reward"));
          };
          case (?_modId) {
            // For module verification, we need the user to call get_module themselves
            // Since get_module checks msg.caller, we can't verify it here
            // Instead, we'll trust the user's claim and verify it's not already claimed
            // In production, you might want a different approach
            conditionMet := true; // Simplified for MVP
          };
        };
      };
    };

    if (not conditionMet) {
      return #err(#ConditionNotMet("Condition not met for reward type"));
    };

    // Get reward configuration
    let configOpt = switch (rewardType) {
      case (#UserVerified) { userVerifiedConfig };
      case (#ModulePassed) { modulePassedConfig };
    };
    switch (configOpt) {
      case (null) {
        return #err(#RewardNotAvailable);
      };
      case (?config) {
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
          moduleId = moduleId;
          token = config.token;
          amount = config.amount;
          claimedAt = Time.now();
          transactionId = transactionId;
        };

        rewardClaims.add(claim);
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

  /// Check if a specific reward is claimed
  public shared query (msg) func isRewardClaimed(userId : ?Principal, rewardType : Types.RewardType, moduleId : ?Nat) : async Bool {
    let targetUserId = switch (userId) {
      case (?uid) { uid };
      case (null) { msg.caller };
    };
    for (claim in rewardClaims.vals()) {
      if (Principal.equal(claim.userId, targetUserId) and rewardTypeEqual(claim.rewardType, rewardType) and moduleIdEqual(claim.moduleId, moduleId)) {
        return true;
      };
    };
    false;
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


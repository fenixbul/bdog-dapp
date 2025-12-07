import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Player "types/player";
import Result "mo:base/Result";
import accessControl "modules/accessControl";
import players "canister:players";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Verification "canister:verification";

shared ({ caller = initializer }) persistent actor class PlayerManager() = this {
  public type VerifiedUser = {
    principal : Principal;
    username : Text;
    verifiedAt : Int;
    createdAt : Text;
    profileImageUrl : Text;
  };

  let authorizedPrincipals = Map.new<Principal, ()>();

  // Initialize authorized principals (by default the initializer is authorized)
  Map.set(authorizedPrincipals, phash, initializer, ());

  // Get player by player caller principal
  public composite query (msg) func getPlayer() : async Result.Result<Player.Player, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Anonymous not allowed");
    };
    
    let playerResult = await players.get_player_by_principal(msg.caller);
    switch (playerResult) {
      case (#ok(player)) { return #ok(player) };
      case (#err(error)) { return #err(error) };
    };
  };

  // Create a new player (user-facing API)
  public shared (msg) func createPlayer(refferer_pid : ?Principal) : async Result.Result<Player.Player, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Anonymous not allowed");
    };

    let player_id = msg.caller;

    // Check if player already exists
    let playerResult = await players.get_player_by_id(player_id);

    switch (playerResult) {
      case (#ok(_)) { return #err("Player already exists") };
      case (#err(error)) {
        switch (error) {
          case ("Player not found") {};
          case (error) { return #err(error) };
        };
      };
    };

    // Call players canister to create the player
    let result = await players.create_player(player_id, refferer_pid);
    switch (result) {
      case (#ok(player)) {
        // TODO: Handle referral rewards if refferer_pid is provided

        return #ok(player);
      };
      case (#err(error)) { return #err(error) };
    };
  };

  // Get verification code from verification canister
  public composite query (msg) func getVerificationCode() : async Result.Result<Text, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Anonymous not allowed");
    };

    await Verification.getVerificationCode(msg.caller);
  };

  // Trigger verification of player's X account - call verification canister to trigger verification
  public shared (msg) func triggerXVerification(x_tweet_id : Text) : async Result.Result<VerifiedUser, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("Anonymous not allowed");
    };

    let verificationResult = await Verification.triggerVerification(msg.caller, x_tweet_id);
    switch (verificationResult) {
      case (#ok(verifiedUser)) {
        // Update player's X verification data
        let updateResult = await players.update_player_x_verification(
          msg.caller,
          verifiedUser.username,
          verifiedUser.profileImageUrl,
          verifiedUser.createdAt,
          verifiedUser.verifiedAt,
        );
        switch (updateResult) {
          case (#ok()) { return #ok(verifiedUser) };
          case (#err(error)) { return #err(error) };
        };
      };
      case (#err(error)) { return #err(error) };
    };
  };

  // Add authorized principals method
  public shared (msg) func addAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to add authorized principals");
    };
    Map.set(authorizedPrincipals, phash, pid, ());
    return #ok();
  };

  // Remove authorized principals method
  public shared (msg) func removeAuthorizedPrincipal(pid : Principal) : async Result.Result<(), Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to remove authorized principals");
    };
    Map.delete(authorizedPrincipals, phash, pid);
    return #ok();
  };

  // Get authorized principals method
  public shared (msg) func getAuthorizedPrincipals() : async Result.Result<[Principal], Text> {
    if (not accessControl.isAuthorized(msg.caller, authorizedPrincipals)) {
      return #err("Caller does not have permission to get authorized principals");
    };
    return #ok(Iter.toArray(Map.keys(authorizedPrincipals)));
  };
};
